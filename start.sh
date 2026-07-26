#!/usr/bin/env bash
#
# start.sh — launch the Expense Tracker backend + frontend together.
#
# Usage:
#   ./start.sh              # start both services (npm start each)
#   ./start.sh --dev        # backend via `npm run dev` (seeds data + nodemon)
#   ./start.sh --no-mongo   # skip the MongoDB check/auto-start
#   ./start.sh --install    # run `npm install` in each project first
#
# Env overrides:
#   MONGO_PORT (default 27017)   BACKEND_PORT (default 3001)   FRONTEND_PORT (default 4200)
#
# Ctrl+C stops both services cleanly.

set -euo pipefail

# --- resolve project directories relative to this script ---
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/expensive-tracker-backend"
FRONTEND_DIR="$ROOT_DIR/expensive-tracker-frontend"

# --- options / defaults ---
BACKEND_CMD="start"
CHECK_MONGO=1
DO_INSTALL=0
MONGO_PORT="${MONGO_PORT:-27017}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
MONGO_CONTAINER="expense-tracker-mongo"

for arg in "$@"; do
  case "$arg" in
    --dev)       BACKEND_CMD="dev" ;;
    --no-mongo)  CHECK_MONGO=0 ;;
    --install)   DO_INSTALL=1 ;;
    -h|--help)
      cat <<'USAGE'
start.sh — launch the Expense Tracker backend + frontend together.

Usage:
  ./start.sh              start both services (npm start each)
  ./start.sh --dev        backend via `npm run dev` (seeds data + nodemon)
  ./start.sh --no-mongo   skip the MongoDB check/auto-start
  ./start.sh --install    run `npm install` in each project first

Env overrides:
  MONGO_PORT (default 27017)   BACKEND_PORT (default 3001)   FRONTEND_PORT (default 4200)

Ctrl+C stops both services cleanly.
USAGE
      exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# --- colored logging helpers ---
c_reset="\033[0m"; c_blue="\033[34m"; c_green="\033[32m"; c_yellow="\033[33m"; c_red="\033[31m"
info()  { echo -e "${c_blue}[start]${c_reset} $*"; }
ok()    { echo -e "${c_green}[start]${c_reset} $*"; }
warn()  { echo -e "${c_yellow}[start]${c_reset} $*"; }
err()   { echo -e "${c_red}[start]${c_reset} $*" >&2; }

# --- sanity checks ---
command -v node >/dev/null 2>&1 || { err "Node.js is not installed."; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm is not installed."; exit 1; }
[ -d "$BACKEND_DIR" ]  || { err "Backend dir not found: $BACKEND_DIR"; exit 1; }
[ -d "$FRONTEND_DIR" ] || { err "Frontend dir not found: $FRONTEND_DIR"; exit 1; }

# --- optional dependency install ---
maybe_install() {
  local dir="$1" name="$2"
  if [ "$DO_INSTALL" -eq 1 ] || [ ! -d "$dir/node_modules" ]; then
    info "Installing $name dependencies…"
    (cd "$dir" && npm install)
  fi
}
maybe_install "$BACKEND_DIR" "backend"
maybe_install "$FRONTEND_DIR" "frontend"

# --- ensure MongoDB is reachable (backend depends on it) ---
mongo_reachable() {
  (exec 3<>"/dev/tcp/127.0.0.1/$MONGO_PORT") >/dev/null 2>&1
}

if [ "$CHECK_MONGO" -eq 1 ]; then
  if mongo_reachable; then
    ok "MongoDB is reachable on port $MONGO_PORT."
  elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    warn "MongoDB not reachable — starting a Docker container ($MONGO_CONTAINER)…"
    if docker ps -a --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
      docker start "$MONGO_CONTAINER" >/dev/null
    else
      docker run -d --name "$MONGO_CONTAINER" \
        -p "$MONGO_PORT:27017" \
        -v "${MONGO_CONTAINER}-data:/data/db" \
        mongo:6 >/dev/null
    fi
    info "Waiting for MongoDB to accept connections…"
    for _ in $(seq 1 30); do mongo_reachable && break; sleep 1; done
    mongo_reachable && ok "MongoDB is up." || { err "MongoDB did not come up in time."; exit 1; }
  else
    warn "MongoDB not reachable on port $MONGO_PORT and Docker is unavailable."
    warn "Start MongoDB manually, or re-run with --no-mongo if it lives elsewhere."
  fi
fi

# --- start both services, tearing down together on exit ---
PIDS=()
cleanup() {
  echo
  info "Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  wait 2>/dev/null || true
  ok "Stopped."
}
trap cleanup INT TERM EXIT

info "Starting backend  → http://localhost:$BACKEND_PORT  (npm run $BACKEND_CMD)"
(cd "$BACKEND_DIR" && PORT="$BACKEND_PORT" npm run "$BACKEND_CMD" 2>&1 | sed "s/^/$(printf "${c_green}[backend]${c_reset} ")/") &
PIDS+=($!)

info "Starting frontend → http://localhost:$FRONTEND_PORT  (npm start)"
(cd "$FRONTEND_DIR" && npm start -- --port "$FRONTEND_PORT" 2>&1 | sed "s/^/$(printf "${c_blue}[frontend]${c_reset} ")/") &
PIDS+=($!)

ok "Both services launching. Press Ctrl+C to stop."
wait
