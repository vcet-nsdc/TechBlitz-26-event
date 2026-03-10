#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"

cd "$ROOT_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║        TechBlitz Rollback                        ║"
echo "╚══════════════════════════════════════════════════╝"

ROLLBACK_EXISTS=false
for SVC in backend frontend; do
  if docker image inspect "techblitz-${SVC}:rollback" &>/dev/null; then
    ROLLBACK_EXISTS=true
    echo "  Found rollback image for $SVC"
  else
    echo "  WARNING: No rollback image for $SVC"
  fi
done

if [ "$ROLLBACK_EXISTS" = false ]; then
  echo "ERROR: No rollback images found. Cannot rollback."
  exit 1
fi

read -rp "Roll back backend and frontend to previous build? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "[1/3] Stopping current services..."
docker compose -f "$COMPOSE_FILE" stop backend frontend

echo "[2/3] Retagging rollback images..."
for SVC in backend frontend; do
  if docker image inspect "techblitz-${SVC}:rollback" &>/dev/null; then
    docker tag "techblitz-${SVC}:rollback" "techblitz-${SVC}:latest"
    echo "  → Restored $SVC:latest from rollback"
  fi
done

echo "[3/3] Restarting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend frontend

echo ""
echo "Rollback complete. Checking health..."
sleep 10
"$SCRIPT_DIR/health-check.sh"
