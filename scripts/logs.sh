#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"

SERVICE="${1:-}"
LINES="${2:-100}"

cd "$ROOT_DIR"

if [ -z "$SERVICE" ]; then
  echo "Usage: scripts/logs.sh <service|all> [lines]"
  echo ""
  echo "Services: postgres redis backend frontend nginx"
  echo "Example:  scripts/logs.sh backend 200"
  echo "          scripts/logs.sh all"
  exit 0
fi

if [ "$SERVICE" = "all" ]; then
  docker compose -f "$COMPOSE_FILE" logs --tail="$LINES" --follow
else
  docker compose -f "$COMPOSE_FILE" logs --tail="$LINES" --follow "$SERVICE"
fi
