# 🔵 Low — Infrastructure, CI and Repository Hygiene

| ID | Issue | Location | Status |
|---|---|---|---|
| I1 | **The GitHub Action never runs.** It targets a `./frontend` directory that doesn't exist and only triggers on `main`, while the default branch is `develop`. | `.github/workflows/testAngular.yaml` | ✅ Fixed |
| I2 | The backend image runs as root, uses `npm install` instead of `npm ci`, ships dev dependencies and has no healthcheck. The frontend build uses `npm install --force`. | `expensive-tracker-backend/Dockerfile`, `expensive-tracker-frontend/Dockerfile` | ✅ Fixed |
| I3 | The backend-only compose file uses `mongo:latest`, publishes port 27017 to the host and enables no authentication. | compose files, `.env.example` | ✅ Fixed: MongoDB is pinned, credentials are required, connection strings authenticate against `admin`, and host publishing is loopback-only. |
| I4 | The in-process recurring scheduler has no lock, so two instances (or the scheduler plus the cron script) generate duplicate occurrences. | `services/recurringScheduler.js`, `scripts/processRecurring.js` | ✅ Fixed: both entry points use an atomic MongoDB lease with crash expiry and owner-checked release. |
| I5 | nginx's `proxy_read_timeout 60s` can cut off a long streamed chat answer while the model is still thinking. | `nginx.conf.template` | ✅ Fixed |
| I6 | `README.md` and `readme.md` are both tracked. They collide on case-insensitive filesystems (the macOS default). | repository root | ✅ Fixed |
| I7 | Unwanted files are tracked: `.DS_Store`, `.scannerwork/`, test hooks, reports and a binary `.app` bundle. | repository | ✅ Fixed |
| I8 | Documentation drift: the README says Angular 19 and Node 18; the code uses Angular 21 and Node 20. | `README.md` | ✅ Fixed |
| I9 | `tests/unit/wallet.test.js` is an integration test that hard-codes its own database name and needs a live MongoDB, so `npm test` fails without one. | backend tests | ⚠️ Environment-dependent: it remains isolated by `MONGO_TEST_URI` when provided; the suite requires MongoDB for integration coverage. |
| I10 | Lower-risk hardening included permissive credentialed CORS, shallow sanitization and account-state enumeration. | `app.js`, `middleware/validation.js`, `services/userService.js`, `models/User.js` | ✅ Fixed: origins are allow-listed, sanitization is recursive without special-casing passwords, and login uses a generic credential error. The chat model remains an explicit product configuration. |
