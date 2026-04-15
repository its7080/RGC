# Godot Client Starter Notes

This folder documents the migration target for a Godot front-end client.

## Suggested scene tree
- `Main.tscn`
  - `UI/BetBoard`
  - `UI/Leaderboard`
  - `3D/Track`
  - `3D/Horses`

## Networking contract (initial)
The Godot client should poll or subscribe to these endpoints from the Go backend:
- `GET /health`
- `GET /v1/round/state`
- `POST /v1/round/tick` (dev helper only)

## Event mapping
- `bet:open` -> show betting UI and timer.
- `bet:closed` -> lock controls, show countdown.
- `race:running` -> start horse animation timeline.
- `race:finished` -> render results and reset flow.
