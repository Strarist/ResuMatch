from sqlalchemy.orm import Session
from app.db.base import Base, engine
from app.core.config import settings
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.core.security import get_password_hash


def init_db() -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)


def create_test_data(db: Session) -> None:
    # Create test user
    test_user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_superuser=False
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    # Create test resume
    test_resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="This is a test resume",
        skills=["Python", "FastAPI", "PostgreSQL"],
        experience={
            "years": 5,
            "positions": [
                {
                    "title": "Senior Developer",
                    "company": "Test Company",
                    "duration": "2 years"
                }
            ]
        },
        education=["Bachelor's in Computer Science"]
    )
    db.add(test_resume)
    db.commit()


if __name__ == "__main__":
    init_db()
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        create_test_data(db)
    finally:
        db.close() 