"""Storage Abstraction — local filesystem with S3-compatible interface."""

from __future__ import annotations
import os
import uuid
import hashlib
from pathlib import Path

from sqlalchemy import Column, DateTime, Integer, String, func
from app.models.base import Base


class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    storage_provider = Column(String, default="local")
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    upload_status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StorageBackend:
    """Local filesystem storage. Replace with S3 in production."""

    def __init__(self, base_dir: str = "./uploads"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def store(self, file_bytes: bytes, filename: str, user_id: str) -> dict:
        file_hash = hashlib.sha256(file_bytes).hexdigest()[:16]
        safe_name = f"{user_id}_{file_hash}_{filename}"
        path = self.base_dir / safe_name

        with open(path, "wb") as f:
            f.write(file_bytes)

        return {
            "file_path": str(path),
            "file_hash": file_hash,
            "size_bytes": len(file_bytes),
            "storage_provider": "local",
        }

    async def delete(self, file_path: str) -> None:
        path = Path(file_path)
        if path.exists():
            path.unlink()

    async def exists(self, file_path: str) -> bool:
        return Path(file_path).exists()
