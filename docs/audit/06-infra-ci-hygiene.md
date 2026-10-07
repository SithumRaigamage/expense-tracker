# 🔵 Low — Infrastructure, CI and Repository Hygiene

| ID | Issue | Location | Status |
|---|---|---|---|
| I1 | **The GitHub Action never runs.** It targets a `./frontend` directory that doesn't exist and only triggers on `main`, while the default branch is `develop`. | `.github/workflows/testAngular.yaml` | ⏳ Open |
| I2 | The backend image runs as root, uses `npm install` instead of `npm ci`, ships dev dependencies and has no healthcheck. The frontend build uses `npm install --force`. | `expensive-tracker-backend/Dockerfile`, `expensive-tracker-frontend/Dockerfile` | ⏳ Open |
| I3 | The backend-only compose file uses `mongo:latest`, publishes port 27017 to the host and enables no authentication. | `expensive-tracker-backend/docker-compose.yml` | ⚠️ Partially fixed: both compose files and `ensure-mongo.sh` pin `mongo:7.0.43` (`latest` had silently become 9.0); the dev port binds to `127.0.0.1` only; `ensure-mongo.sh` waits for a real `ping` instead of an open port, which Docker's port proxy accepts even when mongod isn't running (branch `fix/i3-pin-mongo`). **Open:** authentication. |
| I4 | The in-process recurring scheduler has no lock, so two instances (or the scheduler plus the cron script) generate duplicate occurrences. | `services/recurringScheduler.js`, `scripts/processRecurring.js` | ⏳ Open |
| I5 | nginx's `proxy_read_timeout 60s` can cut off a long streamed chat answer while the model is still thinking. | `nginx.conf.template` | ⏳ Open |
| I6 | `README.md` and `readme.md` are both tracked. They collide on case-insensitive filesystems (the macOS default). | repository root | ⏳ Open |
| I7 | Unwanted files are tracked: `.DS_Store`, `expensive-tracker-backend/.scannerwork/`, `src/hook-test.js` (both apps), the `reports/` folder and a binary `.app` bundle. | repository | ⏳ Open |
| I8 | Documentation drift: the README says Angular 19 and Node 18; the code uses Angular 21 and Node 20. | `README.md` | ⏳ Open |
| I9 | `tests/unit/wallet.test.js` is an integration test that hard-codes its own database name and needs a live MongoDB, so `npm test` fails without one. | backend tests | ⏳ Open |
| I10 | Lower-risk hardening: dev CORS sends `*` together with credentials; `sanitizeInput` trims and rewrites passwords; login reveals "deactivated" before checking the password (account enumeration); ~~the `User` pre-save hook doesn't `return` after `next()`~~ (fixed alongside C1); the chat model is pinned to `claude-opus-5` (confirm this is intended). | `app.js`, `middleware/validation.js`, `services/userService.js`, `models/User.js`, `services/chatService.js` | ⏳ Open |
