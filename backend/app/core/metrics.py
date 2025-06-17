from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_client.openmetrics.exposition import generate_latest
from fastapi import Response
from typing import Dict, Any
import time
from functools import wraps

# Request metrics
REQUEST_COUNT = Counter(
    'resumatch_http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'resumatch_http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
)

# WebSocket metrics
WS_CONNECTIONS = Gauge(
    'resumatch_websocket_connections',
    'Number of active WebSocket connections',
    ['type']  # analysis or matches
)

WS_MESSAGES = Counter(
    'resumatch_websocket_messages_total',
    'Total number of WebSocket messages',
    ['type', 'direction']  # type: analysis/matches, direction: sent/received
)

WS_CONNECTION_DURATION = Histogram(
    'resumatch_websocket_connection_duration_seconds',
    'WebSocket connection duration in seconds',
    ['type'],
    buckets=(60, 300, 900, 1800, 3600, 7200, 14400, 28800, 57600, 115200)
)

# Background task metrics
BACKGROUND_TASKS = Counter(
    'resumatch_background_tasks_total',
    'Total number of background tasks',
    ['type', 'status']  # type: analysis/matching, status: started/completed/failed
)

TASK_DURATION = Histogram(
    'resumatch_background_task_duration_seconds',
    'Background task duration in seconds',
    ['type'],
    buckets=(1, 5, 15, 30, 60, 120, 300, 600, 1800, 3600)
)

# Cache metrics
CACHE_OPERATIONS = Counter(
    'resumatch_cache_operations_total',
    'Total number of cache operations',
    ['operation', 'status']  # operation: get/set/delete, status: hit/miss/error
)

CACHE_SIZE = Gauge(
    'resumatch_cache_size_bytes',
    'Current size of the cache in bytes'
)

# Database metrics
DB_OPERATIONS = Counter(
    'resumatch_db_operations_total',
    'Total number of database operations',
    ['operation', 'table', 'status']  # operation: select/insert/update/delete
)

DB_CONNECTIONS = Gauge(
    'resumatch_db_connections',
    'Number of active database connections'
)

# System metrics
SYSTEM_MEMORY = Gauge(
    'resumatch_system_memory_bytes',
    'System memory usage in bytes',
    ['type']  # type: used/available/total
)

SYSTEM_CPU = Gauge(
    'resumatch_system_cpu_percent',
    'System CPU usage percentage',
    ['type']  # type: user/system/idle
)

# Custom metrics for business logic
MATCH_SCORES = Histogram(
    'resumatch_match_scores',
    'Distribution of match scores',
    ['type'],  # type: resume-job/job-resume
    buckets=(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0)
)

ANALYSIS_DURATION = Histogram(
    'resumatch_analysis_duration_seconds',
    'Duration of resume/job analysis in seconds',
    ['type'],  # type: resume/job
    buckets=(1, 5, 15, 30, 60, 120, 300, 600)
)

def track_request_metrics(method: str, endpoint: str, status: int, duration: float):
    """Track HTTP request metrics"""
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

def track_websocket_metrics(ws_type: str, direction: str):
    """Track WebSocket message metrics"""
    WS_MESSAGES.labels(type=ws_type, direction=direction).inc()

def track_background_task(task_type: str, status: str, duration: float = None):
    """Track background task metrics"""
    BACKGROUND_TASKS.labels(type=task_type, status=status).inc()
    if duration is not None:
        TASK_DURATION.labels(type=task_type).observe(duration)

def track_cache_metrics(operation: str, status: str):
    """Track cache operation metrics"""
    CACHE_OPERATIONS.labels(operation=operation, status=status).inc()

def track_db_metrics(operation: str, table: str, status: str):
    """Track database operation metrics"""
    DB_OPERATIONS.labels(operation=operation, table=table, status=status).inc()

def track_match_score(score: float, match_type: str):
    """Track match score metrics"""
    MATCH_SCORES.labels(type=match_type).observe(score)

def track_analysis_duration(duration: float, analysis_type: str):
    """Track analysis duration metrics"""
    ANALYSIS_DURATION.labels(type=analysis_type).observe(duration)

def metrics_middleware():
    """Middleware to track request metrics"""
    def decorator(func):
        @wraps(func)
        async def wrapper(request, *args, **kwargs):
            start_time = time.time()
            try:
                response = await func(request, *args, **kwargs)
                status = response.status_code
            except Exception as e:
                status = 500
                raise e
            finally:
                duration = time.time() - start_time
                track_request_metrics(
                    method=request.method,
                    endpoint=request.url.path,
                    status=status,
                    duration=duration
                )
            return response
        return wrapper
    return decorator

async def metrics_endpoint():
    """Endpoint to expose Prometheus metrics"""
    return Response(
        generate_latest(),
        media_type="text/plain"
    )

# System metrics collection
def update_system_metrics():
    """Update system metrics (memory, CPU)"""
    import psutil
    
    # Memory metrics
    memory = psutil.virtual_memory()
    SYSTEM_MEMORY.labels(type='used').set(memory.used)
    SYSTEM_MEMORY.labels(type='available').set(memory.available)
    SYSTEM_MEMORY.labels(type='total').set(memory.total)
    
    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=None, percpu=True)
    SYSTEM_CPU.labels(type='user').set(sum(p.user for p in psutil.cpu_times_percent(interval=None, percpu=True)))
    SYSTEM_CPU.labels(type='system').set(sum(p.system for p in psutil.cpu_times_percent(interval=None, percpu=True)))
    SYSTEM_CPU.labels(type='idle').set(sum(p.idle for p in psutil.cpu_times_percent(interval=None, percpu=True)))

# Database metrics collection
def update_db_metrics(db):
    """Update database metrics"""
    # Get connection pool stats
    pool = db.get_bind().pool
    DB_CONNECTIONS.set(pool.size())
    
    # Track active connections
    DB_CONNECTIONS.set(pool.checkedin() + pool.checkedout()) 