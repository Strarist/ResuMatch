import asyncio
from sqlalchemy.ext.asyncio import AsyncEngine
from app.db import engine
from app.models import Base
from sqlalchemy import text

async def run_migrations():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Create GIN index for skills array
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_resumes_skills_gin ON resumes USING GIN (skills);
        """))
        # Create GIN index for jobs.requirements if needed
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_jobs_requirements_gin ON jobs USING GIN (requirements);
        """))
        # Create users table if not exists
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                provider VARCHAR NOT NULL,
                profile_img VARCHAR
            );
        """))
        # Add user_id to resumes if not exists
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resumes' AND column_name='user_id') THEN
                    ALTER TABLE resumes ADD COLUMN user_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1;
                END IF;
            END$$;
        """))
    print("Migrations complete.")

if __name__ == "__main__":
    asyncio.run(run_migrations()) 