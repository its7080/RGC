# Golang + Godot Migration Plan

## Goal
Move the current Node.js + React prototype toward:
- **Go backend** for deterministic game loop and simpler deployment.
- **Godot client** for richer 2D/3D rendering and kiosk packaging.

## Phase 1: Parallel Go backend
1. Mirror core endpoints (`auth`, `round state`, `bets`, `reports`) in Go.
2. Keep PostgreSQL schema unchanged to reduce migration risk.
3. Run Node and Go side-by-side until feature parity.

## Phase 2: Shared protocol
1. Define canonical JSON payloads for game state transitions.
2. Add compatibility tests to ensure Node and Go emit equivalent states.
3. Freeze protocol before major Godot UI build.

## Phase 3: Godot client
1. Port storyboard phases (betting, countdown, race, result).
2. Connect to Go API/WebSocket and verify low-latency updates.
3. Produce kiosk exports for Linux/Windows targets.

## Definition of done
- Go service owns production API.
- Godot client replaces React kiosk UI.
- Admin/super-admin tools either move to Godot admin panel or remain web-based as separate surface.
