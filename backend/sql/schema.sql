CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kiosk', 'admin', 'super-admin')),
  kiosk_id TEXT
);

CREATE TABLE IF NOT EXISTS kiosks (
  kiosk_id TEXT PRIMARY KEY,
  coin_balance INTEGER NOT NULL DEFAULT 0,
  min_bet INTEGER NOT NULL DEFAULT 1,
  max_bet INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rounds (
  game_type TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  result JSONB
);

CREATE TABLE IF NOT EXISTS bets (
  bet_id TEXT PRIMARY KEY,
  kiosk_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  round_id TEXT NOT NULL,
  option_value TEXT NOT NULL,
  wager INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  round_duration_seconds INTEGER NOT NULL DEFAULT 60,
  game_availability JSONB NOT NULL DEFAULT '{"horseRace": true, "andarBahar": true, "cards52": true, "cards24": true, "cards20": true, "tenKaDum": true, "luckySpin": true}'::jsonb
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, username, password, role, kiosk_id)
VALUES
  ('kiosk-1', 'kiosk', 'kiosk123', 'kiosk', 'K-001'),
  ('admin-1', 'admin', 'admin123', 'admin', NULL),
  ('super-1', 'superadmin', 'super123', 'super-admin', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kiosks (kiosk_id, coin_balance, min_bet, max_bet, active)
VALUES ('K-001', 10000, 10, 500, TRUE)
ON CONFLICT (kiosk_id) DO NOTHING;

INSERT INTO rounds (game_type, round_id, stage, result)
VALUES ('horseRace', 'R-INIT', 'bet:open', NULL)
ON CONFLICT (game_type) DO NOTHING;

INSERT INTO system_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
