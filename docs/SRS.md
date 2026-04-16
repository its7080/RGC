# Royal Gold Casino — Software Requirements Specification (SRS)

Version: 5.1 (Implementation-Aligned Summary)  
Product: Royal Gold Casino (Entertainment-Only Platform)

## 1. Purpose
This SRS defines the functional and non-functional requirements for the Royal Gold Casino web platform, focused on virtual-coin game operations, role-based management, and real-time round events.

## 2. Scope
The system provides:
- Role-based access for kiosk operators, admins, and super-admins.
- Real-time round lifecycle management and event broadcasting.
- Virtual bet placement and validation for supported games.
- QR token signing and verification for placed bets.
- Operational administration, audit logging, and system configuration.

Out of scope:
- Real-money transactions, payment gateways, and cash-out workflows.

## 3. User Classes
- **Kiosk User**: Places bets during open windows.
- **Admin User**: Monitors dashboard metrics and manages kiosk balances.
- **Super Admin User**: Manages admins, global configuration, and audit review.

## 4. Functional Requirements

### FR-1 Authentication and Authorization
1. The system shall authenticate users via username and password.
2. The system shall issue JWTs on successful authentication.
3. The system shall enforce role checks for protected endpoints.

### FR-2 Active Games and Round Visibility
1. The system shall expose currently available games from system configuration.
2. The system shall return current round states for active games.

### FR-3 Bet Placement
1. The system shall allow kiosk users to place bets only when round stage is `bet:open`.
2. The system shall reject bets from inactive kiosks.
3. The system shall enforce kiosk min/max wager limits.
4. The system shall reject bets when kiosk balance is insufficient.
5. On valid bet placement, the system shall persist the bet, deduct coins, and emit `bet:placed`.

### FR-4 QR Signing and Verification
1. The system shall generate signed QR payloads for placed bets.
2. The system shall verify QR signature integrity.
3. The system shall return bet and associated round details for valid tokens.

### FR-5 Round Lifecycle and Animation Events
1. The system shall support creating/starting a new round.
2. The system shall support closing bet window for a round.
3. The system shall emit animation phases (`start_gate`, `race_pack`, `finish_zoom`) after close.
4. The system shall publish and broadcast final results.

### FR-6 Admin Operations
1. The system shall provide dashboard metrics for admin and super-admin roles.
2. The system shall support kiosk coin balance adjustments by admin/super-admin.

### FR-7 Super Admin Operations
1. The system shall allow super-admin to create admin accounts.
2. The system shall allow super-admin to update system configuration.
3. The system shall allow super-admin to retrieve audit logs.

### FR-8 Auditability
1. The system shall log security and governance actions (login, bets, coin adjustments, config changes, admin creation).

## 5. Data Requirements
The persistent data model shall include:
- `users`
- `kiosks`
- `rounds`
- `bets`
- `system_config`
- `audit_logs`

The system shall store primary data in PostgreSQL.

## 6. Interface Requirements

### 6.1 HTTP API
- `POST /auth/login`
- `GET /games/active`
- `POST /bets`
- `POST /qr/verify`
- `GET /admin/dashboard`
- `POST /admin/kiosks/:kioskId/coins`
- `POST /super/admins`
- `POST /super/config`
- `GET /audit-logs`

### 6.2 Real-Time Socket Events
- Outbound: `round:start`, `bet:open`, `bet:close`, `game:animate`, `result:publish`, `bet:placed`, `round:state`
- Inbound control: `round:next`, `round:close`, `round:publish`

## 7. Non-Functional Requirements

### NFR-1 Security
- JWT-protected APIs shall be used for authorization.
- Signed QR payloads shall detect tampering.
- Plain-text password storage is not acceptable for production and shall be replaced by strong hashing.

### NFR-2 Performance
- Real-time events shall be broadcast with low latency suitable for live round visualization.

### NFR-3 Reliability
- Service startup shall initialize schema and fail fast on data-layer initialization errors.

### NFR-4 Maintainability
- Data access logic shall be isolated in repository modules.
- Game lifecycle logic shall be isolated in dedicated engine modules.

### NFR-5 Scalability Readiness
- Redis shall be available for cache/pub-sub and future multi-instance socket fanout.

## 8. Assumptions and Constraints
- The platform is entertainment-only and uses virtual coins.
- Initial seeded credentials are for demo/testing.
- Configuration and governance operations require elevated roles.

## 9. Acceptance Criteria (High-Level)
1. A kiosk user can place valid bets only during open bet stage.
2. Invalid bets are rejected with clear errors.
3. Admin can retrieve dashboard and adjust kiosk balance.
4. Super-admin can create admins, update config, and view audit logs.
5. Round controls emit expected lifecycle and animation events.
6. Result publication updates live state for connected clients.
