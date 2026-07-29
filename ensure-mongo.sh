#!/usr/bin/env bash
#
# ensure-mongo.sh — make sure MongoDB is listening before the backend starts.
#
# Runs only when NODE_ENV=development (read from the shell, else from the backend
# .env, else assumed development). Any other value is a no-op — a deployed
# environment points at its own database.
#
# Order of attempts:
#   1. Already reachable on MONGO_PORT?            → done
#   2. Docker daemon down but installed on macOS?  → launch Docker Desktop, wait
#   3. Start the `mongodb` service from the backend docker-compose.yml
#      (falls back to a plain `docker run` if compose is unavailable)
#
# Usage:
#   ./ensure-mongo.sh          # bootstrap MongoDB, exit non-zero if it can't
#   SKIP_MONGO=1 ./ensure-mongo.sh   # no-op (e.g. Mongo Atlas / remote DB)
#
# Env overrides:
#   MONGO_PORT (default 27017)   DOCKER_WAIT (default 60s)   MONGO_WAIT (default 45s)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/expensive-tracker-backend/docker-compose.yml"
COMPOSE_PROJECT="expense-tracker"
COMPOSE_SERVICE="mongodb"
FALLBACK_CONTAINER="expense-tracker-mongo"

MONGO_PORT="${MONGO_PORT:-27017}"
DOCKER_WAIT="${DOCKER_WAIT:-60}"
MONGO_WAIT="${MONGO_WAIT:-45}"

c_reset="\033[0m"; c_blue="\033[34m"; c_green="\033[32m"; c_yellow="\033[33m"; c_red="\033[31m"
info() { echo -e "${c_blue}[mongo]${c_reset} $*"; }
ok()   { echo -e "${c_green}[mongo]${c_reset} $*"; }
warn() { echo -e "${c_yellow}[mongo]${c_reset} $*"; }
err()  { echo -e "${c_red}[mongo]${c_reset} $*" >&2; }

[ "${SKIP_MONGO:-0}" = "1" ] && { info "SKIP_MONGO=1 — assuming MongoDB lives elsewhere."; exit 0; }

# --- development only ---
# The shell env wins; otherwise read NODE_ENV from the backend .env (npm scripts
# run before dotenv loads it). Unset anywhere = local dev, so default accordingly.
resolve_node_env() {
  if [ -n "${NODE_ENV:-}" ]; then
    echo "$NODE_ENV"; return
  fi
  local env_file="$ROOT_DIR/expensive-tracker-backend/.env"
  if [ -f "$env_file" ]; then
    local value
    value="$(sed -n 's/^[[:space:]]*NODE_ENV[[:space:]]*=[[:space:]]*//p' "$env_file" | tail -1 | tr -d '"'\''\r' | sed 's/[[:space:]]*#.*$//;s/[[:space:]]*$//')"
    [ -n "$value" ] && { echo "$value"; return; }
  fi
  echo "development"
}

NODE_ENV_RESOLVED="$(resolve_node_env)"
if [ "$NODE_ENV_RESOLVED" != "development" ]; then
  info "NODE_ENV=$NODE_ENV_RESOLVED (not development) — skipping the MongoDB container."
  exit 0
fi

mongo_reachable() { (exec 3<>"/dev/tcp/127.0.0.1/$MONGO_PORT") >/dev/null 2>&1; }

# Poll a predicate once a second. wait_for <seconds> <command…>
wait_for() {
  local timeout="$1"; shift
  for _ in $(seq 1 "$timeout"); do
    "$@" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

if mongo_reachable; then
  ok "Already reachable on port $MONGO_PORT."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  err "MongoDB is not running on port $MONGO_PORT and Docker is not installed."
  err "Install Docker, start a local mongod, or set SKIP_MONGO=1 to bypass this check."
  exit 1
fi

# --- make sure the Docker daemon itself is up ---
if ! docker info >/dev/null 2>&1; then
  if [ "$(uname -s)" = "Darwin" ] && [ -d "/Applications/Docker.app" ]; then
    info "Docker daemon is not running — starting Docker Desktop…"
    open -a Docker
    if wait_for "$DOCKER_WAIT" docker info; then
      ok "Docker daemon is up."
    else
      err "Docker Desktop did not become ready within ${DOCKER_WAIT}s."
      exit 1
    fi
  else
    err "Docker is installed but the daemon is not running. Start Docker and retry."
    exit 1
  fi
fi

# --- start the MongoDB container ---
if [ -f "$COMPOSE_FILE" ] && docker compose version >/dev/null 2>&1; then
  info "Starting MongoDB via docker compose ($COMPOSE_SERVICE)…"
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d "$COMPOSE_SERVICE"
else
  info "Starting MongoDB container ($FALLBACK_CONTAINER)…"
  if docker ps -a --format '{{.Names}}' | grep -qx "$FALLBACK_CONTAINER"; then
    docker start "$FALLBACK_CONTAINER" >/dev/null
  else
    docker run -d --name "$FALLBACK_CONTAINER" \
      -p "$MONGO_PORT:27017" \
      -v "${FALLBACK_CONTAINER}-data:/data/db" \
      mongo:latest >/dev/null
  fi
fi

info "Waiting for MongoDB to accept connections on port ${MONGO_PORT}…"
if wait_for "$MONGO_WAIT" mongo_reachable; then
  ok "MongoDB is up."
else
  err "MongoDB did not accept connections within ${MONGO_WAIT}s."
  err "Check container logs: docker logs expense-tracker-db"
  exit 1
fi
