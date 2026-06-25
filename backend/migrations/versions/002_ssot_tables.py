"""add SSOT product tables

Revision ID: 002_ssot_tables
Revises: 001_initial_uuid
Create Date: 2026-06-22
"""

from alembic import op
import sqlalchemy as sa

revision = "002_ssot_tables"
down_revision = "001_initial_uuid"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    def fk_col(name: str, target: str, nullable: bool = False):
        if is_sqlite:
            return sa.Column(name, sa.String(36), sa.ForeignKey(target, ondelete="CASCADE"), nullable=nullable)
        from sqlalchemy.dialects import postgresql
        return sa.Column(
            name,
            postgresql.UUID(as_uuid=True) if "users.id" in target else sa.String(36),
            sa.ForeignKey(target, ondelete="CASCADE"),
            nullable=nullable,
        )

    # strategic_profiles — user_id is String(36) in ORM for cross-DB compatibility
    op.create_table(
        "strategic_profiles",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("inferred_skills", sa.JSON(), nullable=True),
        sa.Column("active_specialization", sa.String(), nullable=True),
        sa.Column("target_role", sa.String(), nullable=True),
        sa.Column("roadmap_progress", sa.JSON(), nullable=True),
        sa.Column("opportunity_alignment", sa.JSON(), nullable=True),
        sa.Column("market_alignment", sa.Float(), nullable=True),
        sa.Column("ai_recommendations", sa.JSON(), nullable=True),
        sa.Column("trajectory_state", sa.JSON(), nullable=True),
        sa.Column("calibration_history", sa.JSON(), nullable=True),
        sa.Column("recruiter_signals", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_strategic_profiles_user_id", "strategic_profiles", ["user_id"])

    op.create_table(
        "user_progress",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resumes_uploaded_count", sa.Integer(), server_default="0"),
        sa.Column("completed_milestones_count", sa.Integer(), server_default="0"),
        sa.Column("achieved_tasks_count", sa.Integer(), server_default="0"),
        sa.Column("recruiter_score_record", sa.Float(), server_default="0"),
        sa.Column("market_readiness_record", sa.Float(), server_default="0"),
        sa.Column("evolving_specialization", sa.String(), nullable=True),
        sa.Column("progression_history", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"], unique=True)

    op.create_table(
        "roadmap_states",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_role", sa.String(), nullable=False),
        sa.Column("current_stage", sa.String(), server_default="active"),
        sa.Column("roadmap_version", sa.Integer(), server_default="1"),
        sa.Column("roadmap_snapshot", sa.JSON(), nullable=True),
        sa.Column("completed_nodes", sa.JSON(), nullable=True),
        sa.Column("deferred_nodes", sa.JSON(), nullable=True),
        sa.Column("active_focus_areas", sa.JSON(), nullable=True),
        sa.Column("confidence_model", sa.JSON(), nullable=True),
        sa.Column("learning_velocity", sa.Float(), server_default="0"),
        sa.Column("last_generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_roadmap_states_user_id", "roadmap_states", ["user_id"])
    op.create_index("ix_roadmap_user_role", "roadmap_states", ["user_id", "target_role"])

    op.create_table(
        "roadmap_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("roadmap_state_id", sa.String(36), sa.ForeignKey("roadmap_states.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("structured_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_roadmap_events_user_time", "roadmap_events", ["user_id", "created_at"])

    op.create_table(
        "workspace_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), server_default="New Session"),
        sa.Column("session_type", sa.String(), server_default="copilot"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ws_sessions_user", "workspace_sessions", ["user_id"])

    op.create_table(
        "workspace_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("workspace_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intelligence_context", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ws_messages_session", "workspace_messages", ["session_id", "created_at"])

    op.create_table(
        "recommendation_actions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recommendation_type", sa.String(), nullable=False),
        sa.Column("recommendation_title", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_rec_actions_user", "recommendation_actions", ["user_id"])


def downgrade() -> None:
    op.drop_table("recommendation_actions")
    op.drop_table("workspace_messages")
    op.drop_table("workspace_sessions")
    op.drop_table("roadmap_events")
    op.drop_table("roadmap_states")
    op.drop_table("user_progress")
    op.drop_table("strategic_profiles")
