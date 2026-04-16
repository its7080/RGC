# Royal Gold Casino — Usability Guide

This guide helps end users and operators quickly understand how to use the platform.

## 1) First-Time Setup

### Start Infrastructure
```bash
docker compose up -d postgres redis
```

### Start Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 2) Default Demo Accounts
Use the role selector in the UI and "Login as Selected Role".

- **Kiosk:** `kiosk` / `kiosk123`
- **Admin:** `admin` / `admin123`
- **Super Admin:** `superadmin` / `super123`

## 3) Common User Flows

### Kiosk Flow (Place a Bet)
1. Select **Kiosk Operator** role.
2. Click **Login as Selected Role**.
3. Ensure a round is active and betting is open.
4. Fill in Game, Option, and Wager.
5. Click **Place Bet**.
6. Copy/store the returned `betId` and `qrToken`.

**Tips:**
- If you get “Bet window closed”, open/start a round first.
- If you get “Bet outside limits”, choose a wager within kiosk limits.
- If you get “Insufficient balance”, ask admin to adjust kiosk coins.

### Admin Flow (Monitor Operations)
1. Select **Admin** role.
2. Login.
3. Click **Refresh Metrics**.
4. Review active bets, total coins in play, kiosk status, and rounds.

### Super Admin Flow (Governance)
1. Select **Super Admin** role.
2. Login.
3. Create admin users from the super-admin panel.
4. Use super-admin APIs to update config and inspect audit logs.

## 4) Understanding Round Control Buttons
The top controls simulate round lifecycle:

- **Start Round**: Opens a new round and starts bet acceptance.
- **Close Bets + Animate**: Ends bet intake and runs animation phases.
- **Publish Result**: Finalizes and broadcasts result payload.

Recommended order:
1) Start Round → 2) Place Bets → 3) Close Bets + Animate → 4) Publish Result

## 5) Reading the Live Event Feed
The event feed shows most recent real-time events as JSON (newest first), including:
- round transitions
- bet placements
- animation state updates
- result publication

Use it to troubleshoot timing, payload shape, and round progression.

## 6) Usability Best Practices
- Always log in before testing protected actions.
- Keep one browser tab per role to avoid token confusion.
- Refresh metrics/events after each major action.
- Use consistent `gameType` values (e.g., `horseRace`) during round testing.

## 7) Troubleshooting Quick Reference

### "Login failed"
- Verify seeded credentials.
- Check backend is running and reachable from frontend.

### "Bet window closed"
- Trigger **Start Round** to open betting.

### "Unauthorized" / "Forbidden"
- Ensure you are logged in with the required role for the endpoint/panel action.

### No live updates
- Confirm backend Socket.IO server is running.
- Refresh frontend and retry the round controls.

## 8) Accessibility & Clarity Recommendations (Next Improvements)
- Add inline field validation messages before submit.
- Add role-specific onboarding tooltips.
- Add color/status badges for round phase and auth state.
- Add copy-to-clipboard controls for QR token payload.
