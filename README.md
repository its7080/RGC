# Royal Gold Casino (Entertainment-Only Platform)

Production-oriented implementation for the **Royal Gold Casino** web-based 3D entertainment platform described in SRS v5.1.

## Stack
- **Frontend**: React + Vite + Socket.IO client
- **Backend**: Node.js + Express + Socket.IO + JWT
- **Data layer**: PostgreSQL (primary) + Redis (ready for pub/sub/cache)

> ⚠️ This repository is entertainment-only (virtual coins). No real-money support is implemented.

## Quick Start

### 1) Run dependencies
```bash
docker compose up -d postgres redis
```

### 2) Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

## Data Layer
- SQL schema + seed data is versioned at `backend/sql/schema.sql`.
- Backend boots only after applying schema in `initializePostgres()`.
- Core entities persisted in PostgreSQL:
  - `users`
  - `kiosks`
  - `rounds`
  - `bets`
  - `system_config`
  - `audit_logs`
- Repository functions in `backend/src/data/repository.js` isolate SQL from route logic.

## Implemented Modules
- JWT authentication with role scopes (`kiosk`, `admin`, `super-admin`)
- Kiosk bet placement and validation during `bet:open`
- QR payload generation + HMAC signature + verification endpoint
- Real-time round lifecycle events via Socket.IO
- Admin endpoints for kiosk balances and reports
- Super-admin endpoints for system/game config and admin creation
- React dashboard with role tabs, live event feed, and sample 3D canvas shell
- Horse-race storyboard animation states that match the provided screenshots:
  - betting board
  - start gate countdown
  - mid-race pack with live leaderboard
  - finish-line zoom frame

## Notes
- Replace plain-text password storage with strong hashing (bcrypt/argon2) before production.
- Wire Redis adapter for multi-instance Socket.IO fanout in clustered deployment.

## Golang + Godot Track
Yes — we can move this project to **Go + Godot** incrementally without blocking current work.

- A starter Go service now lives under `go-backend/` with round-state endpoints.
- A Godot client starter spec now lives under `godot-client/README.md`.
- A staged migration plan is documented in `docs/golang-godot-migration.md`.

### Run the Go starter
```bash
cd go-backend
go run ./cmd/server
```

Quick checks:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/v1/round/state
curl -X POST http://localhost:8080/v1/round/tick
```
