#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd "$ROOT_DIR"

# ─── Preflight checks ───
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in production values."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "ERROR: docker not found in PATH"
  exit 1
fi

echo "╔══════════════════════════════════════════════════╗"
echo "║        TechBlitz Deploy — $TIMESTAMP       ║"
echo "╚══════════════════════════════════════════════════╝"

# ─── Tag current state for rollback ───
echo "[1/5] Tagging current images for rollback..."
for SVC in backend frontend; do
  CURRENT=$(docker compose -f "$COMPOSE_FILE" images "$SVC" -q 2>/dev/null || true)
  if [ -n "$CURRENT" ]; then
    docker tag "$CURRENT" "techblitz-${SVC}:rollback" 2>/dev/null || true
    echo "  → Tagged $SVC:rollback"
  fi
done

# ─── Build ───
echo "[2/5] Building images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel

# ─── Run migrations ───
echo "[3/5] Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
  backend npx prisma migrate deploy

# ─── Deploy ───
echo "[4/5] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# ─── Health check ───
echo "[5/5] Waiting for services to become healthy..."
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  HEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    grep -c '"healthy"' || true)
  TOTAL=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    grep -c '"Service"' || echo "5")
  if [ "$HEALTHY" -ge 4 ]; then
    echo ""
    echo "All services healthy."
    break
  fi
  printf "."
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo ""
  echo "WARNING: Not all services healthy within ${TIMEOUT}s"
  docker compose -f "$COMPOSE_FILE" ps
  echo ""
  echo "Run: scripts/logs.sh to investigate"
  exit 1
fi

echo ""
echo "Deploy complete at $(date)"
docker compose -f "$COMPOSE_FILE" ps
