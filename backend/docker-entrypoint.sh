#!/bin/sh
set -e
cd /app
alembic upgrade head
exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --workers 1 \
  --timeout 120 \
  --graceful-timeout 30 \
  --keep-alive 75 \
  --access-logfile -
