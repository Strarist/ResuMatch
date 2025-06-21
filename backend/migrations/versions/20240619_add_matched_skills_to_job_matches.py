"""
Add matched_skills and related columns to job_matches

Revision ID: 20240619_add_matched_skills
Revises: 
Create Date: 2024-06-19
"""
from alembic import op
import sqlalchemy as sa

revision = '20240619_add_matched_skills'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('job_matches', sa.Column('matched_skills', sa.JSON(), nullable=True))
    op.add_column('job_matches', sa.Column('missing_skills', sa.JSON(), nullable=True))
    op.add_column('job_matches', sa.Column('suggestions', sa.JSON(), nullable=True))
    op.add_column('job_matches', sa.Column('analysis_data', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('job_matches', 'matched_skills')
    op.drop_column('job_matches', 'missing_skills')
    op.drop_column('job_matches', 'suggestions')
    op.drop_column('job_matches', 'analysis_data') 