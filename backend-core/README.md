# ClassWatch — Backend Core (Pranav)

Express + Socket.io server implementing API_CONTRACT.md section 1. Port 4000.

## Run it
```
npm install
cp .env.example .env
npm start
```
Then check `http://localhost:4000/health` and `http://localhost:4000/rooms`.

## What's already working
- `GET /rooms`, `GET /rooms/:id`, `GET /rooms/:id/history`, `GET /timetable`, `GET /alerts`
- `POST /rooms/:id/override`
- `POST /ingest` (internal — this is what the Simulator hits)
- Socket.io `/live` namespace emitting `room:update` every ~4s (mocked jitter, so frontend has something live to render immediately) and `ledger:update` every 10s
- `alert:new` / `actuation:event` fire from `/ingest` and `/rooms/:id/override`
- Calls to ML (`:8001`), Decision (`:8002`), Actuation (`:8003`) are all wrapped with 1.5s timeouts and safe fallbacks — this server will NOT crash or hang if those services aren't up yet. Decision fallback defaults to `log_only` (never auto-actuates on a guess).

## Not done yet — pick up next
1. **`/nlquery`** — thin proxy to Anthropic API (see TODO in `server.js`). Inject `/rooms`, `/alerts`, `/ledger` as context.
2. Swap the mocked `setInterval` heartbeat in `server.js` for real data once the Simulator is posting to `/ingest`.
3. MQTT ingest (section 1.5) — only after the above is solid and tested. Gate behind `USE_MQTT` env var.

## File map
```
server.js          entrypoint, socket.io setup, background heartbeats
lib/store.js        in-memory "DB" — rooms/history/timetable/alerts/ledger, seeded to match contract shape
lib/rules.js         rules engine: idle_after_class / occupancy_mismatch / off_peak
lib/services.js      axios wrappers for ML/Decision/Actuation with fallbacks
routes/rooms.js      section 1 REST endpoints
routes/ingest.js     POST /ingest — runs rules, calls ML/Decision, auto-actuates, emits socket events
```

## Give this to teammates right now
Once `npm start` works, tell Nidhi/frontend they can point `VITE_API_URL=http://localhost:4000` and start building against real (if mocked-live) data immediately — no need to wait for you to finish the ML/Decision/Actuation wiring.
