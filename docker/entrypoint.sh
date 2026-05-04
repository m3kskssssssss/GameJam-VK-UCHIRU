#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "→ Applying Prisma migrations..."
  ./node_modules/.bin/prisma migrate deploy
else
  echo "⚠ DATABASE_URL is empty; skipping migrations."
fi

exec "$@"
