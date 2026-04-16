# Royal Gold Casino — Features Guide

This document explains the user-facing features currently available in the **entertainment-only** Royal Gold Casino platform.

## Platform Scope
- Virtual-coin experience only (no real-money wagering or payouts).
- Real-time game round flow for horse-race style sessions.
- Role-based controls for kiosk operators, admins, and super-admins.

## User Roles and Capabilities

### 1) Kiosk Operator
- Log in with kiosk credentials.
- Place bets during an open betting window.
- Receive a QR token for each placed bet.
- View live game animation states and event feed.

### 2) Admin
- Open dashboard metrics from the admin panel.
- View active bets, total coins in play, kiosk status, and round states.
- Adjust kiosk coin balances using admin APIs.

### 3) Super Admin
- All admin capabilities.
- Create new admin accounts.
- Update system configuration (maintenance mode, round duration, game availability).
- Access audit logs.

## Game Round Lifecycle (All Enabled Games)
Each enabled game (Lucky Horse Race, Andar Bahar, 52 Cards, 24 Cards, 20 Cards, 10 Ka Dum, Lucky Spin) follows this automatic timeline every **300 seconds (5 minutes)**:
1. **round:start** → new round begins.
2. **bet:open** → kiosks can place bets.
3. **bet:close** → betting window closes.
4. **game:animate** phases:
   - `start_gate` countdown
   - `race_pack` mid-race leaderboard
   - `finish_zoom` end-frame focus
5. **result:publish** → final ranking/result is broadcast.

## Betting and Validation
When a kiosk submits a bet, the backend validates:
- Betting window is open for the selected game.
- Kiosk is active.
- Wager is within kiosk min/max limits.
- Kiosk has enough virtual coin balance.

If valid, the system:
- Persists the bet.
- Deducts kiosk coins.
- Emits a live `bet:placed` event.
- Returns bet details and signed QR token.

## QR Verification Feature
- Each placed bet can be encoded as a signed QR token.
- Verification endpoint validates signature integrity and fetches bet + round state.
- Invalid/modified tokens are rejected.

## Admin & Oversight Features
- Dashboard summary for operations visibility.
- Coin adjustment endpoint for kiosk balancing.
- System config update endpoint for centralized controls.
- Audit logs for significant actions (auth, bets, config updates, admin creation).

## Frontend Experience Highlights
- Role switcher for kiosk/admin/super-admin flows.
- One-click quick login using seeded credentials.
- Real-time event feed (recent Socket.IO events).
- Game canvas storyboard that visually tracks round phases.

## Data Persistence Features
PostgreSQL stores:
- users
- kiosks
- rounds
- bets
- system_config
- audit_logs

Redis is included for readiness around cache/pub-sub scale-out scenarios.

## Current Limitations (Important)
- Passwords are currently stored as plain text in seed/demo flow.
- The app is designed for entertainment simulation, not financial transactions.
- Some controls are exposed for demo speed and should be hardened before production.
