"""Structured logging — shared Loguru helpers and handler configuration."""

import json
import os
import sys
from collections.abc import Callable
from typing import Any

from loguru import logger

from app.config import Settings


def json_log_line(record) -> str:
    """One JSON object string (no trailing newline)."""
    return json.dumps({
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "file": record["file"].name,
        "function": record["function"],
        "line": record["line"],
    })


def json_formatter(record):
    """Loguru dynamic format: payload is substituted; line break is in the template only."""
    record["extra"]["json_payload"] = json_log_line(record)
    return "{extra[json_payload]}\n"


def configure_logging(
    settings: Settings,
    *,
    production_formatter: Callable[[Any], str] | None = None,
) -> None:
    """Register Loguru handlers once at application startup."""
    logger.remove()
    os.makedirs(settings.log_dir, exist_ok=True)

    if settings.is_production:
        formatter = production_formatter or json_formatter
        logger.add(sys.stdout, format=formatter, level="INFO", serialize=False)
        return

    dev_fmt = (
        "<green>{time:HH:mm:ss}</green> | <level>{level: <7}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan> | {message}"
    )
    logger.add(
        sys.stderr,
        format=dev_fmt,
        level=settings.log_level,
        colorize=True,
    )
    logger.add(
        os.path.join(settings.log_dir, "app.log"),
        level=settings.log_level,
        rotation="10 MB",
        retention="10 days",
        format=json_formatter,
        serialize=False,
        enqueue=True,
    )
