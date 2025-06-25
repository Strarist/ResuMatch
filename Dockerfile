# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements-dev.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app ./app
COPY backend/uploads ./uploads

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Expose port
EXPOSE 8000

# Run migrations on startup, then start the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 