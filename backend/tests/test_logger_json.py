"""Ensure file logger emits parseable JSON lines."""

import json
import tempfile
from datetime import datetime

from loguru import logger

from app.logger import configure_logging, json_formatter, json_log_line
from app.observability import _json_formatter, _json_log_line


def _sample_record():
    return {
        "time": datetime(2026, 6, 24, 12, 0, 0),
        "level": type("Level", (), {"name": "INFO"})(),
        "message": "test message",
        "file": type("File", (), {"name": "test.py"})(),
        "function": "test_fn",
        "line": 42,
        "extra": {},
    }


def test_json_log_line_emits_valid_json():
    line = json_log_line(_sample_record())
    parsed = json.loads(line)

    assert parsed["message"] == "test message"
    assert parsed["level"] == "INFO"
    assert parsed["line"] == 42
    assert line.startswith("{")
    assert not line.startswith("{{")
    assert "\n" not in line


def test_json_formatter_writes_single_newline_jsonl():
    record = _sample_record()
    template = json_formatter(record)
    assert template == "{extra[json_payload]}\n"

    line = record["extra"]["json_payload"] + "\n"
    parsed = json.loads(line.strip())
    assert parsed["message"] == "test message"

    path = tempfile.mktemp(suffix=".log")
    handler_id = logger.add(path, format=json_formatter, serialize=False, enqueue=False)
    try:
        logger.info("integration line")
    finally:
        logger.remove(handler_id)

    with open(path, encoding="utf-8") as log_file:
        raw = log_file.read()

    assert raw.endswith("\n")
    assert not raw.endswith("\n\n")
    assert json.loads(raw.strip())["message"] == "integration line"


def test_observability_json_log_line_emits_valid_json():
    record = _sample_record()
    record["name"] = "app.test"
    record["exception"] = None
    line = _json_log_line(record)
    parsed = json.loads(line)

    assert parsed["msg"] == "test message"
    assert parsed["level"] == "INFO"
    assert parsed["module"] == "app.test"
    assert "\n" not in line


def test_observability_json_formatter_writes_single_newline_jsonl():
    record = _sample_record()
    record["name"] = "app.test"
    record["exception"] = None
    template = _json_formatter(record)
    assert template == "{extra[json_payload]}\n"
    assert json.loads(record["extra"]["json_payload"])["msg"] == "test message"


def test_configure_logging_dev_registers_file_and_stderr():
    from app.config import get_settings

    settings = get_settings()
    configure_logging(settings)
    assert len(logger._core.handlers) >= 2  # noqa: SLF001 — test-only introspection
