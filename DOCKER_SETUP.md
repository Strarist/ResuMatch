# ResuMatchAI Docker Setup

This document provides instructions for running ResuMatchAI using Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker

## Quick Start

### 1. Build and Start Services

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Check Service Status

```bash
# Check all services
docker-compose ps

# Check health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## Development Mode

For development with hot reloading:

```bash
# Use development configuration
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Or build and run in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

## Service Details

### PostgreSQL Database
- **Port**: 5432
- **Database**: resumeapp
- **User**: user
- **Password**: pass
- **Volume**: postgres_data

### Redis Cache
- **Port**: 6379
- **Volume**: redis_data
- **Memory Limit**: 256MB

### Backend API (FastAPI)
- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **Logs**: backend_logs volume

### Frontend (React + Nginx)
- **Port**: 3000
- **Health Check**: http://localhost:3000/health
- **Logs**: frontend_logs volume

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Rebuild a specific service
docker-compose build backend

# View logs for a specific service
docker-compose logs -f backend

# Execute commands in a running container
docker-compose exec backend python -c "print('Hello from backend')"
docker-compose exec postgres psql -U user -d resumeapp

# Check resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 5432, and 6379 are available
2. **Memory issues**: Increase Docker memory limit to at least 4GB
3. **Build failures**: Clear Docker cache with `docker system prune -f`

### Health Checks

All services include health checks. Check status with:

```bash
docker-compose ps
```

### Logs

View detailed logs for troubleshooting:

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis
```

### Database Issues

If database initialization fails:

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait for postgres to be ready, then start other services
docker-compose up -d
```

## Environment Variables

Key environment variables can be modified in `docker-compose.yml`:

- `SECRET_KEY`: Change for production
- `POSTGRES_PASSWORD`: Database password
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Production Considerations

For production deployment:

1. Change default passwords
2. Use proper secret management
3. Configure SSL/TLS
4. Set up proper backup strategies
5. Configure monitoring and alerting
6. Use external database and Redis instances
7. Set appropriate resource limits 