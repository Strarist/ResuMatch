from app.db.base import Base

target_metadata = Base.metadata

import app.models
print(f"Alembic target_metadata tables: {list(target_metadata.tables.keys())}")

import app.models 