"""add project_evidence table and workspace session pinned column

Revision ID: 003_portfolio_workspace
Revises: a1ab61b412a5
Create Date: 2026-06-22
"""

from alembic import op
import sqlalchemy as sa

revision = "003_portfolio_workspace"
down_revision = "a1ab61b412a5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_evidence",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_name", sa.String(), nullable=False),
        sa.Column("github_url", sa.String(), nullable=True),
        sa.Column("live_url", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("stack", sa.JSON(), nullable=True),
        sa.Column("deployment_platform", sa.String(), nullable=True),
        sa.Column("ci_cd_present", sa.Boolean(), server_default=sa.false()),
        sa.Column("dockerized", sa.Boolean(), server_default=sa.false()),
        sa.Column("cloud_services_used", sa.JSON(), nullable=True),
        sa.Column("ai_features_present", sa.Boolean(), server_default=sa.false()),
        sa.Column("testing_present", sa.Boolean(), server_default=sa.false()),
        sa.Column("documentation_score", sa.Integer(), server_default="0"),
        sa.Column("architecture_complexity", sa.String(), server_default="basic"),
        sa.Column("production_readiness_score", sa.Float(), server_default="0"),
        sa.Column("recruiter_signal_strength", sa.Float(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_project_evidence_user", "project_evidence", ["user_id"])

    with op.batch_alter_table("workspace_sessions") as batch_op:
        batch_op.add_column(sa.Column("pinned", sa.Boolean(), server_default=sa.false(), nullable=False))


def downgrade() -> None:
    with op.batch_alter_table("workspace_sessions") as batch_op:
        batch_op.drop_column("pinned")
    op.drop_index("ix_project_evidence_user", table_name="project_evidence")
    op.drop_table("project_evidence")
