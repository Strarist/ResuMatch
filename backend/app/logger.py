from loguru import logger
import os
import sys
import json
from loguru._defaults import LOGURU_FORMAT

LOG_DIR = os.getenv("LOG_DIR", "logs")
LOG_FILE = os.path.join(LOG_DIR, "sanitizer.log")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_ROTATION = os.getenv("LOG_ROTATION", "10 MB")
LOG_RETENTION = os.getenv("LOG_RETENTION", "10 days")
EXTERNAL_LOG_SINK = os.getenv("EXTERNAL_LOG_SINK")  # e.g., URL or file path

os.makedirs(LOG_DIR, exist_ok=True)

# Remove default logger
logger.remove()

# JSON formatter for structured logs
def json_formatter(record):
    log_record = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "file": record["file"].name,
        "function": record["function"],
        "line": record["line"],
        "extra": record["extra"],
        "exception": record["exception"].repr if record["exception"] else None,
    }
    return json.dumps(log_record)

# Local file sink with rotation
logger.add(
    LOG_FILE,
    level=LOG_LEVEL,
    rotation=LOG_ROTATION,
    retention=LOG_RETENTION,
    format=json_formatter,
    serialize=False,
    enqueue=True,
    backtrace=True,
    diagnose=True,
)

# Optional: External sink (e.g., Logtail, Loki)
if EXTERNAL_LOG_SINK:
    logger.add(EXTERNAL_LOG_SINK, level=LOG_LEVEL, format=json_formatter, serialize=False, enqueue=True)

# Also log to stderr for dev
logger.add(sys.stderr, level=LOG_LEVEL, format=json_formatter, serialize=False, enqueue=True) 