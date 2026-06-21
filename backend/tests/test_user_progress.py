import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.user_progress import UserProgress
from app.services.user_progress_service import get_or_create_user_progress


@pytest.mark.asyncio
async def test_get_or_create_user_progress_normal_flow(db_session):
    # 1. Create a test user
    user = User(name="Test User", email="test_progress@example.com", provider="local")
    db_session.add(user)
    await db_session.flush()

    # 2. Call get_or_create_user_progress the first time (should create)
    progress1 = await get_or_create_user_progress(db_session, user.id)
    assert progress1 is not None
    assert progress1.user_id == user.id
    assert progress1.resumes_uploaded_count == 0

    # 3. Call get_or_create_user_progress the second time (should retrieve)
    progress2 = await get_or_create_user_progress(db_session, user.id)
    assert progress2 is not None
    assert progress2.id == progress1.id
    assert progress2.user_id == user.id


@pytest.mark.asyncio
async def test_get_or_create_user_progress_auto_repair_duplicates(db_session):
    # 1. Create a test user
    user = User(name="Test User Duplicates", email="test_duplicates@example.com", provider="local")
    db_session.add(user)
    await db_session.flush()

    # We want to simulate a situation where multiple records exist in the DB.
    # Since the DB now has a unique constraint, we can't easily insert duplicates using SQL.
    # But we can mock the session's execute to return multiple records to verify the auto-repair logic.
    mock_progress1 = UserProgress(id="id-1", user_id=user.id, resumes_uploaded_count=1)
    mock_progress2 = UserProgress(id="id-2", user_id=user.id, resumes_uploaded_count=2)

    # We mock the return value of db_session.execute to simulate returning both records.
    original_execute = db_session.execute

    class MockResult:
        def scalars(self):
            class MockScalars:
                def unique(self):
                    return self
                def all(self):
                    return [mock_progress1, mock_progress2]
            return MockScalars()

    async def mock_execute(statement, *args, **kwargs):
        # Only intercept the select UserProgress statement
        if isinstance(statement, type(select(UserProgress))):
            return MockResult()
        return await original_execute(statement, *args, **kwargs)

    db_session.execute = mock_execute

    # 2. Call the service method. It should detect duplicates, delete all but the first, and return the first.
    # Note: since delete will be called on mock_progress2, we should mock delete on db_session or capture it.
    deleted_items = []
    original_delete = db_session.delete
    async def mock_delete(instance):
        deleted_items.append(instance)
        # Avoid trying to delete mock object from actual DB session to prevent errors
        if hasattr(instance, '_sa_instance_state'):
            try:
                await original_delete(instance)
            except Exception:
                pass
    db_session.delete = mock_delete

    progress = await get_or_create_user_progress(db_session, user.id)

    assert progress.id == "id-1"
    assert len(deleted_items) == 1
    assert deleted_items[0].id == "id-2"


@pytest.mark.asyncio
async def test_get_or_create_user_progress_concurrency_handling(db_session):
    # 1. Create a test user
    user = User(name="Test Concurrency", email="test_concurrency@example.com", provider="local")
    db_session.add(user)
    await db_session.flush()

    original_execute = db_session.execute
    original_add = db_session.add

    # We will simulate a concurrent insert:
    # First select returns empty list.
    # The insert (db.add/flush) raises an IntegrityError.
    # Then the retry select returns the user progress created by the concurrent thread.

    select_count = 0
    created_progress = UserProgress(id="concurrent-id", user_id=user.id, resumes_uploaded_count=5)

    class MockResultEmpty:
        def scalars(self):
            class MockScalars:
                def unique(self):
                    return self
                def all(self):
                    return []
            return MockScalars()

    class MockResultSuccess:
        def scalars(self):
            class MockScalars:
                def unique(self):
                    return self
                def all(self):
                    return [created_progress]
            return MockScalars()

    async def mock_execute(statement, *args, **kwargs):
        nonlocal select_count
        if isinstance(statement, type(select(UserProgress))):
            select_count += 1
            if select_count == 1:
                return MockResultEmpty()
            else:
                return MockResultSuccess()
        return await original_execute(statement, *args, **kwargs)

    # Let's mock flush/begin_nested to raise an IntegrityError once
    original_flush = db_session.flush
    async def mock_flush(*args, **kwargs):
        nonlocal select_count
        if select_count == 1:
            raise IntegrityError("mock_statement", "mock_params", orig=Exception("Unique constraint failed"))
        return await original_flush(*args, **kwargs)

    db_session.execute = mock_execute
    db_session.flush = mock_flush

    # 2. Call the service method. It should handle the integrity error, rollback savepoint, and fetch existing.
    progress = await get_or_create_user_progress(db_session, user.id)

    assert progress.id == "concurrent-id"
    assert progress.resumes_uploaded_count == 5
    assert select_count == 2
