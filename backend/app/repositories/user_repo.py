"""User repository — database queries only. Never commits."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, *, name: str, email: str, provider: str,
                     password_hash: str | None = None, profile_img: str | None = None) -> User:
        user = User(
            name=name, email=email, provider=provider,
            password_hash=password_hash, profile_img=profile_img,
        )
        self.db.add(user)
        await self.db.flush()  # generates user.id without committing
        return user

    async def update(self, user: User, **fields: str | None) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        await self.db.flush()
        return user
