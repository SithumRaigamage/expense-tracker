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
# MongoDB is bootstrapped by ensure-mongo.sh: when NODE_ENV=development it starts
# Docker Desktop if needed, brings up the `mongodb` compose service, and waits for
# it to accept connections. The backend's `npm run dev` runs the same script via
# `predev`. Any other NODE_ENV skips the container entirely.
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

MongoDB is bootstrapped by ensure-mongo.sh (starts Docker Desktop if needed, then
the `mongodb` compose service) — only when NODE_ENV=development. `npm run dev` in
the backend does the same.

Env overrides:
  MONGO_PORT (default 27017)   BACKEND_PORT (default 3001)   FRONTEND_PORT (default 4200)
  SKIP_MONGO=1                 same as --no-mongo (e.g. when using Mongo Atlas)

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
# Delegated to ensure-mongo.sh, which is also used by the backend's `npm run dev`.
if [ "$CHECK_MONGO" -eq 1 ]; then
  MONGO_PORT="$MONGO_PORT" bash "$ROOT_DIR/ensure-mongo.sh"
else
  warn "Skipping MongoDB check (--no-mongo)."
fi

# --- start both services, tearing down together on exit ---
PIDS=()

# npm/nodemon/ng each spawn their own children, so killing the job leader alone
# leaves node holding the ports. Walk the tree and kill depth-first instead.
kill_tree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill "$pid" >/dev/null 2>&1 || true
}

cleanup() {
  trap - INT TERM EXIT
  echo
  info "Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    [ -n "$pid" ] && kill_tree "$pid"
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
