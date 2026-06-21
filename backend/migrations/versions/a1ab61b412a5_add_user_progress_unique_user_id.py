"""add_user_progress_unique_user_id

Revision ID: a1ab61b412a5
Revises: 001_initial_uuid
Create Date: 2026-05-30 04:13:27.400663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1ab61b412a5'
down_revision: Union[str, Sequence[str], None] = '001_initial_uuid'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Clean up duplicate rows in user_progress table
    # Keep the newest record per user_id, sorting by updated_at desc, created_at desc, then id desc
    op.execute("""
        DELETE FROM user_progress
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY user_id
                    ORDER BY updated_at DESC, created_at DESC, id DESC
                ) as rn
                FROM user_progress
            ) t
            WHERE t.rn = 1
        )
    """)

    # 2. Drop existing non-unique index and create a unique index on user_id
    try:
        op.drop_index('ix_user_progress_user_id', table_name='user_progress')
    except Exception:
        pass

    op.create_index('ix_user_progress_user_id', 'user_progress', ['user_id'], unique=True)


def downgrade() -> None:
    try:
        op.drop_index('ix_user_progress_user_id', table_name='user_progress')
    except Exception:
        pass
    op.create_index('ix_user_progress_user_id', 'user_progress', ['user_id'], unique=False)
