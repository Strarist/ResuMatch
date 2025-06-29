#!/bin/bash
# Startup script for Render deployment

echo "Starting ResuMatch Backend..."

# Run database migrations if needed
# python -m alembic upgrade head

# Start the application
exec gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120 