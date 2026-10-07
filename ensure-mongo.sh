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
COMPOSE_CONTAINER="expense-tracker-db"
FALLBACK_CONTAINER="expense-tracker-mongo"
# Keep in step with the docker-compose files (see the root one on upgrades).
MONGO_IMAGE="${MONGO_IMAGE:-mongo:7.0.43}"

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

# The container that holds the dev database, once we know it. Empty means an
# externally managed mongod (e.g. Homebrew), which we can only probe over TCP.
MONGO_CONTAINER=""

container_running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }

# Running and publishing mongod on MONGO_PORT, i.e. the database the backend will use.
container_serves_port() {
  container_running "$1" && docker port "$1" 27017/tcp 2>/dev/null | grep -q ":$MONGO_PORT\$"
}

# A TCP connect alone isn't proof: Docker's port proxy accepts connections while
# the container is running even if mongod isn't listening (still starting, or
# crashing on boot). For our own container, ask mongod to answer a ping.
mongo_reachable() {
  if [ -n "$MONGO_CONTAINER" ]; then
    docker exec "$MONGO_CONTAINER" mongosh --quiet --eval 'db.adminCommand("ping").ok' 2>/dev/null | grep -qx 1
  else
    (exec 3<>"/dev/tcp/127.0.0.1/$MONGO_PORT") >/dev/null 2>&1
  fi
}

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  for name in "$COMPOSE_CONTAINER" "$FALLBACK_CONTAINER"; do
    container_serves_port "$name" && { MONGO_CONTAINER="$name"; break; }
  done
fi

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
  MONGO_CONTAINER="$COMPOSE_CONTAINER"
else
  info "Starting MongoDB container ($FALLBACK_CONTAINER)…"
  if docker ps -a --format '{{.Names}}' | grep -qx "$FALLBACK_CONTAINER"; then
    existing_image="$(docker inspect -f '{{.Config.Image}}' "$FALLBACK_CONTAINER")"
    [ "$existing_image" != "$MONGO_IMAGE" ] && \
      warn "$FALLBACK_CONTAINER runs $existing_image, not $MONGO_IMAGE. Remove it to switch: docker rm -f $FALLBACK_CONTAINER"
    docker start "$FALLBACK_CONTAINER" >/dev/null
  else
    docker run -d --name "$FALLBACK_CONTAINER" \
      -p "127.0.0.1:$MONGO_PORT:27017" \
      -v "${FALLBACK_CONTAINER}-data:/data/db" \
      "$MONGO_IMAGE" >/dev/null
  fi
  MONGO_CONTAINER="$FALLBACK_CONTAINER"
fi

info "Waiting for MongoDB to answer a ping…"
if wait_for "$MONGO_WAIT" mongo_reachable; then
  ok "MongoDB is up."
else
  err "MongoDB did not answer within ${MONGO_WAIT}s. Last log lines from $MONGO_CONTAINER:"
  docker logs --tail 5 "$MONGO_CONTAINER" 2>&1 | sed 's/^/    /' >&2
  exit 1
fi
