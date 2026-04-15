# Royal Gold Casino (Entertainment-Only Platform)

Production-oriented starter implementation for the **Royal Gold Casino** web-based 3D entertainment platform described in SRS v5.1.

## Stack
- **Frontend**: React + Vite + Socket.IO client
- **Backend**: Node.js + Express + Socket.IO + JWT
- **Data layer**: PostgreSQL + Redis (dockerized services)

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
npm run dev
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

## Implemented Modules
- JWT authentication with role scopes (`kiosk`, `admin`, `super-admin`)
- Kiosk bet placement and validation during `bet:open`
- QR payload generation + HMAC signature + verification endpoint
- Real-time round lifecycle events via Socket.IO
- Admin endpoints for kiosk balances and audit readout
- Super-admin endpoints for system/game config and admin creation
- React dashboard with role tabs, live event feed, and sample 3D canvas shell

## Notes
- The backend currently uses an in-memory store for demo velocity.
- Adapters are structured for replacing storage with PostgreSQL/Redis repositories.
