#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"

BASE_URL="${1:-http://localhost}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$STATUS" = "$expected" ]; then
    echo "  ✓ $name ($STATUS)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name (got $STATUS, expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo "╔══════════════════════════════════════════════════╗"
echo "║        TechBlitz Health Check                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo "Docker service status:"
cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Service}}\t{{.State}}\t{{.Health}}"
echo ""

echo "Endpoint checks:"
check "Nginx health"           "$BASE_URL/nginx-health"
check "Backend health"         "$BASE_URL/api/health"
check "Backend ready"          "$BASE_URL/api/ready"
check "Frontend home"          "$BASE_URL/"
echo ""

echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Some checks failed. Run: scripts/logs.sh all"
  exit 1
fi
