"""initial schema with uuid primary keys

Revision ID: 001_initial_uuid
Revises:
Create Date: 2026-05-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial_uuid"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if not is_sqlite:
        op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    def get_id_column():
        if is_sqlite:
            return sa.Column("id", sa.String(36), primary_key=True)
        else:
            return sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True)

    def get_skills_column():
        if is_sqlite:
            return sa.Column("skills", sa.JSON())
        else:
            return sa.Column("skills", postgresql.ARRAY(sa.Text()))

    def get_json_column(name, nullable=True):
        if is_sqlite:
            return sa.Column(name, sa.JSON(), nullable=nullable)
        else:
            return sa.Column(name, postgresql.JSONB(), nullable=nullable)

    def get_fk_column(name, target, nullable=False):
        if is_sqlite:
            return sa.Column(name, sa.String(36), sa.ForeignKey(target, ondelete="CASCADE"), nullable=nullable)
        else:
            return sa.Column(name, postgresql.UUID(as_uuid=True), sa.ForeignKey(target, ondelete="CASCADE"), nullable=nullable)

    op.create_table(
        "users",
        get_id_column(),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("profile_img", sa.String(), nullable=True),
        sa.Column("password_hash", sa.String(), nullable=True),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "resumes",
        get_id_column(),
        sa.Column("filename", sa.String(), nullable=False),
        get_skills_column(),
        sa.Column("raw_text", sa.Text()),
        get_json_column("parsed_data"),
        sa.Column("parse_status", sa.String(), server_default="pending"),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        get_fk_column("user_id", "users.id", nullable=False),
    )

    op.create_table(
        "jobs",
        get_id_column(),
        sa.Column("title", sa.String(), nullable=False),
        get_json_column("requirements", nullable=False),
    )

    op.create_table(
        "matches",
        get_id_column(),
        get_fk_column("resume_id", "resumes.id", nullable=False),
        get_fk_column("job_id", "jobs.id", nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "file_sanitization_audit",
        get_id_column(),
        sa.Column("user_id", sa.String(36) if is_sqlite else postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("status", sa.Enum("success", "failure", name="sanitizationstatus"), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
    )

    # Indexes for query performance
    op.create_index("ix_resumes_user_id_uploaded", "resumes", ["user_id", "uploaded_at"])
    op.create_index("ix_resumes_parse_status", "resumes", ["parse_status"])
    op.create_index("ix_matches_resume_id_score", "matches", ["resume_id", "score"])
    op.create_index("ix_matches_job_id", "matches", ["job_id"])
    op.create_index("ix_audit_user_id", "file_sanitization_audit", ["user_id"])


def downgrade() -> None:
    op.drop_table("file_sanitization_audit")
    op.drop_table("matches")
    op.drop_table("jobs")
    op.drop_table("resumes")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        op.execute("DROP TYPE IF EXISTS sanitizationstatus")
