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
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
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
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("skills", postgresql.ARRAY(sa.Text())),
        sa.Column("raw_text", sa.Text()),
        sa.Column("parsed_data", postgresql.JSONB()),
        sa.Column("parse_status", sa.String(), server_default="pending"),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    )

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("requirements", postgresql.JSONB(), nullable=False),
    )

    op.create_table(
        "matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "file_sanitization_audit",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
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
    op.execute("DROP TYPE IF EXISTS sanitizationstatus")
