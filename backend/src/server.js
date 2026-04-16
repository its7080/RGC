import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import {
  authenticateCredentials,
  hashPassword,
  issueAuthTokens,
  requireAuth,
  requireRole,
  revokeSessionTokens,
  rotateRefreshToken
} from './auth.js';
import { signPayload, verifyPayload } from './qr.js';
import { closeBetWindow, createRound, ensureRound, publishResult, GAME_RULES } from './gameEngine.js';
import {
  appendAudit,
  createAdmin,
  createBetAndAdjustKioskCoins,
  getBet,
  getKiosk,
  getRound,
  getRounds,
  getSystemConfig,
  listKiosks,
  listAuditLogs,
  listRecentBets,
  migrateLegacyPasswords,
  updateSystemConfig
} from './data/repository.js';
import { inTransaction, initializePostgres } from './data/postgres.js';
import {
  validateAdjustCoinsBody,
  validateBetBody,
  validateCreateAdminBody,
  validateLoginBody,
  validateQrBody,
  validateRefreshBody,
  validateSuperConfigBody
} from './validation.js';

const AUTO_ROUND_INTERVAL_MS = 300_000;
const ANIMATION_STEPS = {
  startDelay: 1200,
  finishDelay: 2600,
  publishDelay: 4200
};

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

function buildRateLimiter({ windowMs, max }) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'global';
    const now = Date.now();
    const item = buckets.get(key) || { count: 0, start: now };
    if (now - item.start >= windowMs) {
      item.count = 0;
      item.start = now;
    }
    item.count += 1;
    buckets.set(key, item);

    if (item.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

const authLimiter = buildRateLimiter({ windowMs: 60_000, max: 15 });
const betsLimiter = buildRateLimiter({ windowMs: 30_000, max: 40 });

app.get('/health', async (_, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post('/auth/login', authLimiter, validateLoginBody, async (req, res) => {
  const { username, password } = req.body;
  const user = await authenticateCredentials(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const { accessToken, refreshToken } = await issueAuthTokens(user);
  await appendAudit(user.username, 'auth.login');
  res.json({ token: accessToken, refreshToken, role: user.role, kioskId: user.kioskId || null });
});

app.post('/auth/refresh', authLimiter, validateRefreshBody, async (req, res) => {
  const rotated = await rotateRefreshToken(req.body.refreshToken);
  if (!rotated) return res.status(401).json({ error: 'Invalid refresh token' });

  await appendAudit(rotated.user.username, 'auth.refresh');
  res.json({ token: rotated.accessToken, refreshToken: rotated.refreshToken, role: rotated.user.role, kioskId: rotated.user.kioskId || null });
});

app.post('/auth/logout', requireAuth, async (req, res) => {
  const raw = req.headers.authorization || '';
  const accessToken = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  await revokeSessionTokens({ refreshToken: req.body?.refreshToken, accessToken });
  await appendAudit(req.user.username, 'auth.logout');
  res.status(204).send();
});

app.get('/games/active', requireAuth, async (_, res) => {
  const currentConfig = await getSystemConfig();
  const rounds = await getRounds();
  const activeGames = Object.entries(currentConfig.gameAvailability)
    .filter(([, enabled]) => enabled)
    .map(([game]) => game);

  res.json({ activeGames, rounds });
});

app.post('/bets', betsLimiter, requireAuth, requireRole('kiosk'), validateBetBody, async (req, res) => {
  const { gameType, option, wager } = req.body;
  const round = await getRound(gameType);
  if (!round || round.stage !== 'bet:open') return res.status(400).json({ error: 'Bet window closed' });

  const kiosk = await getKiosk(req.user.kioskId);
  if (!kiosk || !kiosk.active) return res.status(403).json({ error: 'Kiosk not active' });
  if (wager < kiosk.minBet || wager > kiosk.maxBet) return res.status(400).json({ error: 'Bet outside limits' });
  if (kiosk.coinBalance < wager) return res.status(400).json({ error: 'Insufficient balance' });

  const result = await inTransaction((db) =>
    createBetAndAdjustKioskCoins(
      {
        kioskId: req.user.kioskId,
        gameType,
        roundId: round.id,
        option,
        wager
      },
      db
    )
  );
  if (!result.kiosk) {
    return res.status(404).json({ error: 'Kiosk not found' });
  }
  const bet = result.bet;

  await appendAudit(req.user.username, 'bet.placed', {
    betId: bet.betId,
    kioskId: bet.kioskId,
    gameType: bet.gameType,
    roundId: bet.roundId
  });

  const qrToken = signPayload({ betId: bet.betId, kioskId: bet.kioskId, roundId: bet.roundId, gameType });
  io.emit('bet:placed', { betId: bet.betId, kioskId: bet.kioskId, gameType, roundId: bet.roundId });

  res.status(201).json({ bet, qrToken });
});

app.post('/qr/verify', requireAuth, validateQrBody, async (req, res) => {
  const { qrToken } = req.body;
  const verify = verifyPayload(qrToken);
  if (!verify.ok) return res.status(400).json({ error: verify.reason });

  const data = verify.data;
  const bet = await getBet(data.betId);
  if (!bet) return res.status(404).json({ error: 'Bet not found' });

  const round = await getRound(bet.gameType);
  res.json({ bet, round });
});

app.get('/admin/dashboard', requireAuth, requireRole('admin', 'super-admin'), async (_, res) => {
  const bets = await listRecentBets();
  const totalCoinsInPlay = bets.reduce((sum, b) => sum + Number(b.wager), 0);
  const kiosks = await listKiosks();
  const rounds = await getRounds();

  res.json({
    activeBets: bets.length,
    totalCoinsInPlay,
    kioskStatus: kiosks.reduce((acc, kiosk) => ({ ...acc, [kiosk.kioskId]: kiosk }), {}),
    rounds
  });
});

app.post('/admin/kiosks/:kioskId/coins', requireAuth, requireRole('admin', 'super-admin'), validateAdjustCoinsBody, async (req, res) => {
  const { kioskId } = req.params;
  const { delta } = req.body;
  const updated = await inTransaction((db) =>
    db.query(
      'UPDATE kiosks SET coin_balance = coin_balance + $2 WHERE kiosk_id = $1 RETURNING kiosk_id AS "kioskId", coin_balance AS "coinBalance"',
      [kioskId, delta]
    ).then((rows) => rows[0] || null)
  );
  if (!updated) return res.status(404).json({ error: 'Kiosk not found' });

  await appendAudit(req.user.username, 'kiosk.coin.adjust', { kioskId, delta });
  res.json(updated);
});

app.post('/super/admins', requireAuth, requireRole('super-admin'), validateCreateAdminBody, async (req, res) => {
  const { username, password } = req.body;
  const passwordHash = await hashPassword(password);
  const admin = await createAdmin(username, passwordHash);
  await appendAudit(req.user.username, 'admin.created', { username });
  res.status(201).json(admin);
});

app.post('/super/config', requireAuth, requireRole('super-admin'), validateSuperConfigBody, async (req, res) => {
  const next = await updateSystemConfig(req.body);
  await appendAudit(req.user.username, 'system.config.updated', req.body);
  res.json({ config: next });
});

app.get('/audit-logs', requireAuth, requireRole('super-admin'), async (_, res) => {
  const logs = await listAuditLogs(500);
  res.json({ logs });
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

function generateLeaderboard(gameType) {
  const total = GAME_RULES[gameType]?.optionCount || 12;
  return Array.from({ length: total }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
}

async function emitRoundOpen(gameType) {
  const round = await createRound(gameType);
  io.emit('round:start', { gameType, ...round });
  io.emit('bet:open', { gameType, roundId: round.id, nextDrawInMs: AUTO_ROUND_INTERVAL_MS });
  return round;
}

async function runRoundAnimation(gameType) {
  const round = await closeBetWindow(gameType);
  io.emit('bet:close', { gameType, roundId: round.id });
  io.emit('game:animate', { gameType, roundId: round.id, phase: 'start_gate', countdown: 5 });

  setTimeout(() => {
    io.emit('game:animate', {
      gameType,
      roundId: round.id,
      phase: 'race_pack',
      leaderboard: generateLeaderboard(gameType)
    });
  }, ANIMATION_STEPS.startDelay);

  setTimeout(() => {
    io.emit('game:animate', {
      gameType,
      roundId: round.id,
      phase: 'finish_zoom',
      leaderboard: generateLeaderboard(gameType)
    });
  }, ANIMATION_STEPS.finishDelay);

  setTimeout(async () => {
    const published = await publishResult(gameType);
    io.emit('result:publish', { gameType, roundId: round.id, result: published.result });
  }, ANIMATION_STEPS.publishDelay);
}

async function getEnabledGames() {
  const system = await getSystemConfig();
  return Object.entries(system.gameAvailability)
    .filter(([, enabled]) => enabled)
    .map(([gameType]) => gameType);
}

async function ensureRoundsForEnabledGames() {
  const games = await getEnabledGames();
  await Promise.all(games.map((gameType) => ensureRound(gameType)));
}

async function runAutoCycle() {
  const games = await getEnabledGames();
  await Promise.all(games.map((gameType) => runRoundAnimation(gameType)));

  setTimeout(async () => {
    const nextGames = await getEnabledGames();
    await Promise.all(nextGames.map((gameType) => emitRoundOpen(gameType)));
  }, ANIMATION_STEPS.publishDelay + 500);
}

function startAutoRoundScheduler() {
  runAutoCycle().catch((error) => console.error('Auto round cycle failed:', error));
  setInterval(() => {
    runAutoCycle().catch((error) => console.error('Auto round cycle failed:', error));
  }, AUTO_ROUND_INTERVAL_MS);
}

io.on('connection', async (socket) => {
  socket.emit('round:state', await getRounds());

  socket.on('round:next', async ({ gameType = 'horseRace' } = {}) => {
    await emitRoundOpen(gameType);
  });

  socket.on('round:close', async ({ gameType = 'horseRace' } = {}) => {
    await runRoundAnimation(gameType);
  });

  socket.on('round:publish', async ({ gameType = 'horseRace' } = {}) => {
    const round = await publishResult(gameType);
    io.emit('result:publish', { gameType, roundId: round.id, result: round.result });
  });
});

initializePostgres()
  .then(async () => {
    await migrateLegacyPasswords();
    await ensureRoundsForEnabledGames();
    await Promise.all((await getEnabledGames()).map((gameType) => emitRoundOpen(gameType)));
    startAutoRoundScheduler();
    httpServer.listen(config.port, () => {
      console.log(`Royal Gold Casino API listening on :${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data layer:', error);
    process.exit(1);
  });
