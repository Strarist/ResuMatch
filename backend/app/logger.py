"""Structured logging configuration."""

import os
import sys
import json

from loguru import logger

from app.config import get_settings

settings = get_settings()

os.makedirs(settings.log_dir, exist_ok=True)

logger.remove()


def json_formatter(record):
    serialized = json.dumps({
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "file": record["file"].name,
        "function": record["function"],
        "line": record["line"],
    })
    return serialized.replace("{", "{{").replace("}", "}}").replace("<", "\\<") + "\n"


logger.add(
    os.path.join(settings.log_dir, "app.log"),
    level=settings.log_level,
    rotation="10 MB",
    retention="10 days",
    format=json_formatter,
    serialize=False,
    enqueue=True,
)

logger.add(sys.stderr, level=settings.log_level, format=json_formatter, enqueue=True)
