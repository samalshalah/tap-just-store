#!/usr/bin/env bash
# One-command local start for the Tap Rater storefront.
# Requires: Node 20+, pnpm (npm i -g pnpm), and Docker Desktop running.
set -e
cd "$(dirname "$0")"

echo "==> Starting Postgres (docker)..."
docker compose up -d
echo "==> Waiting for Postgres..."
until docker exec taprater-db pg_isready -U preview >/dev/null 2>&1; do sleep 1; done

if [ ! -f .env.local ]; then
  echo "==> Writing .env.local"
  cat > .env.local <<'ENV'
DATABASE_URL=postgres://preview:preview@127.0.0.1:5432/preview
ADMIN_PASSWORD=tapjust-admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTJS_ENV=development
ENV
fi

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies (first run only, a few minutes)..."
  pnpm install
fi

echo "==> Pushing database schema..."
pnpm db:push

echo "==> Seeding brand + category (Tap Rater / NFC Stands)..."
docker exec -i taprater-db psql -U preview -d preview < seed/seed.sql

echo ""
echo "=================================================="
echo " Storefront : http://localhost:3000"
echo " Admin      : http://localhost:3000/admin/login"
echo " Password   : tapjust-admin"
echo "=================================================="
echo ""
pnpm dev
