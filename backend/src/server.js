import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { authenticateCredentials, issueToken, requireAuth, requireRole } from './auth.js';
import { audit, store } from './store.js';
import { signPayload, verifyPayload } from './qr.js';
import { closeBetWindow, createRound, publishResult } from './gameEngine.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = authenticateCredentials(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = issueToken(user);
  audit(user.username, 'auth.login');
  res.json({ token, role: user.role, kioskId: user.kioskId || null });
});

app.get('/games/active', requireAuth, (_, res) => {
  const activeGames = Object.entries(store.config.gameAvailability)
    .filter(([, enabled]) => enabled)
    .map(([game]) => game);
  res.json({ activeGames, rounds: store.rounds });
});

app.post('/bets', requireAuth, requireRole('kiosk'), (req, res) => {
  const { gameType, option, wager } = req.body;
  const round = store.rounds[gameType];
  if (!round || round.stage !== 'bet:open') return res.status(400).json({ error: 'Bet window closed' });

  const kiosk = store.kiosks[req.user.kioskId];
  if (!kiosk || !kiosk.active) return res.status(403).json({ error: 'Kiosk not active' });
  if (wager < kiosk.minBet || wager > kiosk.maxBet) return res.status(400).json({ error: 'Bet outside limits' });
  if (kiosk.coinBalance < wager) return res.status(400).json({ error: 'Insufficient balance' });

  const betId = `B-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const bet = {
    betId,
    kioskId: req.user.kioskId,
    gameType,
    roundId: round.id,
    option,
    wager,
    status: 'accepted',
    createdAt: new Date().toISOString()
  };

  kiosk.coinBalance -= wager;
  store.bets.push(bet);
  audit(req.user.username, 'bet.placed', bet);

  const qrToken = signPayload({ betId, kioskId: bet.kioskId, roundId: bet.roundId, gameType });
  io.emit('bet:placed', { betId, kioskId: bet.kioskId, gameType, roundId: bet.roundId });

  res.status(201).json({ bet, qrToken });
});

app.post('/qr/verify', requireAuth, (req, res) => {
  const { qrToken } = req.body;
  const verify = verifyPayload(qrToken);
  if (!verify.ok) return res.status(400).json({ error: verify.reason });

  const data = verify.data;
  const bet = store.bets.find((b) => b.betId === data.betId);
  if (!bet) return res.status(404).json({ error: 'Bet not found' });

  res.json({ bet, round: store.rounds[bet.gameType] || null });
});

app.get('/admin/dashboard', requireAuth, requireRole('admin', 'super-admin'), (_, res) => {
  const totalCoinsInPlay = store.bets.reduce((sum, b) => sum + b.wager, 0);
  res.json({
    activeBets: store.bets.length,
    totalCoinsInPlay,
    kioskStatus: store.kiosks,
    rounds: store.rounds
  });
});

app.post('/admin/kiosks/:kioskId/coins', requireAuth, requireRole('admin', 'super-admin'), (req, res) => {
  const { kioskId } = req.params;
  const { delta } = req.body;
  const kiosk = store.kiosks[kioskId];
  if (!kiosk) return res.status(404).json({ error: 'Kiosk not found' });

  kiosk.coinBalance += Number(delta || 0);
  audit(req.user.username, 'kiosk.coin.adjust', { kioskId, delta });
  res.json({ kioskId, coinBalance: kiosk.coinBalance });
});

app.post('/super/admins', requireAuth, requireRole('super-admin'), (req, res) => {
  const { username, password } = req.body;
  const admin = { id: `admin-${Date.now()}`, username, password, role: 'admin' };
  store.users.push(admin);
  audit(req.user.username, 'admin.created', { username });
  res.status(201).json({ id: admin.id, username, role: admin.role });
});

app.post('/super/config', requireAuth, requireRole('super-admin'), (req, res) => {
  const payload = req.body;
  store.config = { ...store.config, ...payload };
  audit(req.user.username, 'system.config.updated', payload);
  res.json({ config: store.config });
});

app.get('/audit-logs', requireAuth, requireRole('super-admin'), (_, res) => {
  res.json({ logs: store.auditLogs.slice(-500) });
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

io.on('connection', (socket) => {
  socket.emit('round:state', store.rounds);

  socket.on('round:next', ({ gameType = 'horseRace' } = {}) => {
    const round = createRound(gameType);
    io.emit('round:start', round);
    io.emit('bet:open', { gameType, roundId: round.id });
  });

  socket.on('round:close', ({ gameType = 'horseRace' } = {}) => {
    const round = closeBetWindow(gameType);
    io.emit('bet:close', { gameType, roundId: round.id });
    io.emit('game:animate', {
      gameType,
      roundId: round.id,
      phase: 'start_animation'
    });
  });

  socket.on('round:publish', ({ gameType = 'horseRace' } = {}) => {
    const round = publishResult(gameType);
    io.emit('result:publish', { gameType, roundId: round.id, result: round.result });
  });
});

httpServer.listen(config.port, () => {
  console.log(`Royal Gold Casino API listening on :${config.port}`);
});
