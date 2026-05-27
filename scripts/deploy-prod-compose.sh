#!/usr/bin/env bash
# Prod: backend ve frontend'i PARALEL DEĞİL sırayla derler, sonra stack'i kaldırır.
# 8GB RAM sunucularda paralel `docker compose build backend frontend` OOM riski taşır.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RECREATE="${RECREATE:-1}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Bulunamadı: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Kök dizinde .env gerekli." >&2
  exit 1
fi

SWAP_KB=$(awk '/^SwapTotal:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)
if [[ "${SKIP_SWAP_CHECK:-0}" != "1" && "${SWAP_KB:-0}" -lt 1048576 ]]; then
  echo "UYARI: Toplam swap 1GB altında. Frontend (Next) Docker build 8GB RAM'de OOM verebilir."
  echo "        Öneri: sudo ./scripts/ensure-swap-for-build.sh"
  echo "        Bu uyarıyı atlamak için: SKIP_SWAP_CHECK=1 $0"
  echo ""
fi

echo "=== 1/3 docker compose build backend ==="
docker compose -f "$COMPOSE_FILE" build backend

echo "=== 2/3 docker compose build frontend ==="
docker compose -f "$COMPOSE_FILE" build frontend

echo "=== 3/3 docker compose up -d ==="
if [[ "$RECREATE" == "1" ]]; then
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate backend frontend
  docker compose -f "$COMPOSE_FILE" up -d
else
  docker compose -f "$COMPOSE_FILE" up -d
fi

echo "Tamam. Konteynerler:"
docker compose -f "$COMPOSE_FILE" ps
