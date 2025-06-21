#!/bin/bash
set -e

echo "Starting ResuMatchAI Backend..."

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h postgres -p 5432 -U user -d resumeapp; do
    echo "PostgreSQL is not ready yet. Waiting..."
    sleep 2
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! redis-cli -h redis -p 6379 ping; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
done
echo "Redis is ready!"

# Initialize database if needed
echo "Initializing database..."
python -c "
import logging
from app.db.init_db import init_db, create_test_data
from app.crud import get_user_by_email
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info('Creating database tables...')
    init_db()
    logger.info('Database tables created.')

    db = SessionLocal()
    try:
        test_user = get_user_by_email(db, email='test@example.com')
        if not test_user:
            logger.info('Creating test data (user, resume)...')
            create_test_data(db)
            logger.info('Test data created successfully.')
        else:
            logger.info('Test user already exists. Skipping data creation.')
    finally:
        db.close()

except Exception as e:
    logger.error(f'Database initialization error: {e}', exc_info=True)
"

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 