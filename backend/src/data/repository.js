import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { query } from './postgres.js';
import { hashPassword } from '../security/password.js';

export async function findUserByUsername(username) {
  const rows = await query(
    'SELECT id, username, password, role, kiosk_id AS "kioskId" FROM users WHERE username = $1 LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const rows = await query(
    'SELECT id, username, password, role, kiosk_id AS "kioskId" FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function getSystemConfig() {
  const rows = await query(
    'SELECT maintenance_mode AS "maintenanceMode", round_duration_seconds AS "roundDurationSeconds", game_availability AS "gameAvailability" FROM system_config WHERE id = 1'
  );
  return rows[0];
}

export async function updateSystemConfig(payload) {
  const current = await getSystemConfig();
  const merged = {
    maintenanceMode: payload.maintenanceMode ?? current.maintenanceMode,
    roundDurationSeconds: payload.roundDurationSeconds ?? current.roundDurationSeconds,
    gameAvailability: payload.gameAvailability ?? current.gameAvailability
  };

  const rows = await query(
    `UPDATE system_config
     SET maintenance_mode = $1,
         round_duration_seconds = $2,
         game_availability = $3::jsonb
     WHERE id = 1
     RETURNING maintenance_mode AS "maintenanceMode", round_duration_seconds AS "roundDurationSeconds", game_availability AS "gameAvailability"`,
    [merged.maintenanceMode, merged.roundDurationSeconds, JSON.stringify(merged.gameAvailability)]
  );

  return rows[0];
}

export async function getRounds() {
  const rows = await query('SELECT game_type AS "gameType", round_id AS "id", stage, result FROM rounds');
  return rows.reduce((acc, row) => {
    acc[row.gameType] = { id: row.id, stage: row.stage, result: row.result };
    return acc;
  }, {});
}

export async function upsertRound(gameType, round) {
  await query(
    `INSERT INTO rounds (game_type, round_id, stage, result)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (game_type)
     DO UPDATE SET round_id = EXCLUDED.round_id, stage = EXCLUDED.stage, result = EXCLUDED.result`,
    [gameType, round.id, round.stage, round.result ? JSON.stringify(round.result) : null]
  );
}

export async function getRound(gameType) {
  const rows = await query(
    'SELECT round_id AS "id", stage, result FROM rounds WHERE game_type = $1 LIMIT 1',
    [gameType]
  );
  return rows[0] || null;
}

export async function getKiosk(kioskId) {
  const rows = await query(
    'SELECT kiosk_id AS "kioskId", coin_balance AS "coinBalance", min_bet AS "minBet", max_bet AS "maxBet", active FROM kiosks WHERE kiosk_id = $1 LIMIT 1',
    [kioskId]
  );
  return rows[0] || null;
}

export async function adjustKioskCoins(kioskId, delta) {
  const rows = await query(
    'UPDATE kiosks SET coin_balance = coin_balance + $2 WHERE kiosk_id = $1 RETURNING kiosk_id AS "kioskId", coin_balance AS "coinBalance"',
    [kioskId, delta]
  );
  return rows[0] || null;
}

export async function createBet({ kioskId, gameType, roundId, option, wager }) {
  const betId = randomUUID();
  const rows = await query(
    `INSERT INTO bets (bet_id, kiosk_id, game_type, round_id, option_value, wager, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'accepted')
     RETURNING bet_id AS "betId", kiosk_id AS "kioskId", game_type AS "gameType", round_id AS "roundId", option_value AS option, wager, status, created_at AS "createdAt"`,
    [betId, kioskId, gameType, roundId, option, wager]
  );
  return rows[0];
}

export async function getBet(betId) {
  const rows = await query(
    'SELECT bet_id AS "betId", kiosk_id AS "kioskId", game_type AS "gameType", round_id AS "roundId", option_value AS option, wager, status, created_at AS "createdAt" FROM bets WHERE bet_id = $1 LIMIT 1',
    [betId]
  );
  return rows[0] || null;
}

export async function listRecentBets() {
  return query(
    'SELECT bet_id AS "betId", kiosk_id AS "kioskId", game_type AS "gameType", round_id AS "roundId", option_value AS option, wager, status, created_at AS "createdAt" FROM bets ORDER BY created_at DESC LIMIT 1000'
  );
}

export async function createAdmin(username, passwordHash) {
  const id = randomUUID();
  const rows = await query(
    'INSERT INTO users (id, username, password, role, kiosk_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id, username, role',
    [id, username, passwordHash, 'admin']
  );
  return rows[0];
}

export async function listKiosks() {
  return query(
    'SELECT kiosk_id AS "kioskId", coin_balance AS "coinBalance", min_bet AS "minBet", max_bet AS "maxBet", active FROM kiosks ORDER BY kiosk_id ASC'
  );
}

export async function createBetAndAdjustKioskCoins({ kioskId, gameType, roundId, option, wager }, db) {
  const betId = randomUUID();
  const betRows = await db.query(
    `INSERT INTO bets (bet_id, kiosk_id, game_type, round_id, option_value, wager, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'accepted')
     RETURNING bet_id AS "betId", kiosk_id AS "kioskId", game_type AS "gameType", round_id AS "roundId", option_value AS option, wager, status, created_at AS "createdAt"`,
    [betId, kioskId, gameType, roundId, option, wager]
  );

  const kioskRows = await db.query(
    'UPDATE kiosks SET coin_balance = coin_balance - $2 WHERE kiosk_id = $1 RETURNING kiosk_id AS "kioskId", coin_balance AS "coinBalance"',
    [kioskId, Number(wager)]
  );

  return { bet: betRows[0], kiosk: kioskRows[0] || null };
}

export async function migrateLegacyPasswords() {
  const users = await query('SELECT id, password FROM users');
  for (const user of users) {
    if (typeof user.password === 'string' && !user.password.startsWith('scrypt$')) {
      const nextHash = await hashPassword(user.password);
      await query('UPDATE users SET password = $2 WHERE id = $1', [user.id, nextHash]);
    }
  }
}

export async function storeRefreshToken({ id, userId, tokenHash, familyId, expiresAt }) {
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, revoked_at, replaced_by)
     VALUES ($1, $2, $3, $4, $5, NULL, NULL)`,
    [id, userId, tokenHash, familyId, expiresAt]
  );
}

export async function findRefreshTokenByHash(tokenHash) {
  const rows = await query(
    `SELECT id, user_id AS "userId", token_hash AS "tokenHash", family_id AS "familyId",
            expires_at AS "expiresAt", revoked_at AS "revokedAt", replaced_by AS "replacedBy"
     FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function revokeRefreshToken(id, replacedBy = null) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = $2 WHERE id = $1', [id, replacedBy]);
}

export async function revokeRefreshTokenFamily(familyId) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL', [familyId]);
}

export async function revokeAccessToken(jti, expiresAt) {
  await query('INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING', [jti, expiresAt]);
}

export async function isAccessTokenRevoked(jti) {
  const rows = await query('SELECT jti FROM revoked_tokens WHERE jti = $1 LIMIT 1', [jti]);
  return Boolean(rows[0]);
}

export async function appendAudit(actor, action, details = {}) {
  await query('INSERT INTO audit_logs (id, actor, action, details) VALUES ($1, $2, $3, $4::jsonb)', [
    crypto.randomUUID(),
    actor,
    action,
    JSON.stringify(details)
  ]);
}

export async function listAuditLogs(limit = 500) {
  return query(
    'SELECT id, actor, action, details, created_at AS "at" FROM audit_logs ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
}
