# Use Python 3.11 slim as the base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        gcc \
        libpq-dev \
        postgresql-client \
        redis-tools \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create logs directory
RUN mkdir -p /app/logs

# Copy requirements first to leverage Docker cache
COPY requirements.txt requirements-test.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Install spaCy model using pip (more reliable than spacy download)
RUN pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Copy the rest of the application
COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

# Create a non-root user and switch to it
RUN useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/scripts/*.sh 2>/dev/null || true

USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["/app/start.sh"] 