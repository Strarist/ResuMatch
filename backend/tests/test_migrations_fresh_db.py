"""Verify Alembic migrations apply on a fresh database."""

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text


@pytest.mark.critical
@pytest.mark.parametrize("dialect", ["sqlite"])
def test_alembic_upgrade_head_creates_ssot_tables(tmp_path, dialect):
    db_path = tmp_path / "migration_test.db"
    url = f"sqlite:///{db_path.as_posix()}"
    async_url = f"sqlite+aiosqlite:///{db_path.as_posix()}"

    old_db = os.environ.get("DATABASE_URL")
    old_env = os.environ.get("ENV")
    os.environ["DATABASE_URL"] = async_url
    os.environ["ENV"] = "testing"
    os.environ.setdefault("JWT_SECRET", "test-secret-minimum-16-chars")

    from app.config import get_settings
    get_settings.cache_clear()

    try:
        backend_dir = Path(__file__).resolve().parent.parent
        alembic_cfg = Config(str(backend_dir / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", str(backend_dir / "migrations"))
        alembic_cfg.set_main_option("sqlalchemy.url", url)

        command.upgrade(alembic_cfg, "head")

        engine = create_engine(url)
        with engine.connect() as conn:
            tables = set(inspect(conn).get_table_names())
            assert "strategic_profiles" in tables
            assert "user_progress" in tables
            assert "roadmap_states" in tables
            assert "workspace_sessions" in tables
            assert "project_evidence" in tables
            conn.execute(text("SELECT 1 FROM strategic_profiles LIMIT 1"))

            ws_cols = {c["name"] for c in inspect(conn).get_columns("workspace_sessions")}
            assert "pinned" in ws_cols

            pe_cols = {c["name"] for c in inspect(conn).get_columns("project_evidence")}
            assert "project_name" in pe_cols
            assert "user_id" in pe_cols

        engine.dispose()
    finally:
        if old_db is not None:
            os.environ["DATABASE_URL"] = old_db
        if old_env is not None:
            os.environ["ENV"] = old_env
        get_settings.cache_clear()
