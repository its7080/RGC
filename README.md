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


## User Documentation
- Feature overview: `docs/FEATURES.md`
- Usability guide: `docs/USABILITY.md`
- SRS document: `docs/SRS.md`

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
- Password hashing is implemented for new/admin-created credentials (scrypt); legacy seed users remain backward-compatible for demo environments.
- Wire Redis adapter for multi-instance Socket.IO fanout in clustered deployment.
