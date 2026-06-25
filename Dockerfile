# === Build stage: install dependencies ===
FROM python:3.11-slim AS builder

WORKDIR /build
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
RUN pip install --no-cache-dir --prefix=/install spacy && \
    PATH="/install/bin:$PATH" PYTHONPATH="/install/lib/python3.11/site-packages" \
    python -m spacy download en_core_web_sm

# === Runtime stage: minimal image ===
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/app ./app
COPY backend/migrations ./migrations
COPY backend/alembic.ini .
COPY backend/pyproject.toml .
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

# Create upload directory
RUN mkdir -p /app/uploads && chmod +x /app/docker-entrypoint.sh

# Non-root user
RUN useradd -r -s /bin/false appuser && chown -R appuser:appuser /app
USER appuser

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Health check (Render uses this, Docker Compose uses this)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Graceful shutdown: gunicorn forwards SIGTERM to workers
ENTRYPOINT ["/app/docker-entrypoint.sh"]
