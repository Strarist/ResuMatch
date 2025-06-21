"""change resumes.id to UUID

Revision ID: b6c9e2eaa1de
Revises: 20240619_add_matched_skills
Create Date: 2025-06-20 17:00:52.791111

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6c9e2eaa1de'
down_revision: Union[str, Sequence[str], None] = '20240619_add_matched_skills'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
