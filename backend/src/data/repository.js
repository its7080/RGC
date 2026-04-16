import crypto from 'crypto';
import { query } from './postgres.js';

export async function findUserByUsername(username) {
  const rows = await query(
    'SELECT id, username, password, role, kiosk_id AS "kioskId" FROM users WHERE username = $1 LIMIT 1',
    [username]
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
  const betId = `B-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
  const id = `admin-${Date.now()}`;
  const rows = await query(
    'INSERT INTO users (id, username, password, role, kiosk_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id, username, role',
    [id, username, passwordHash, 'admin']
  );
  return rows[0];
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
