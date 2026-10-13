#!/usr/bin/env sh
set -e

echo "[entrypoint] Running database migrations (alembic upgrade head)..."
alembic upgrade head

echo "[entrypoint] Seeding default categories, departments, and admin..."
python -m app.cli init-all

echo "[entrypoint] Starting application: $@"
exec "$@"
