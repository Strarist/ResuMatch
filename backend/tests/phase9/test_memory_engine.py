"""Test Phase 9 memory engine trends."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.memory_engine.trends import analyze_trends
from app.models.memory import CareerMemorySnapshot

@pytest.mark.asyncio
async def test_analyze_trends_confidence_growth():
    # Setup mock session and snapshots
    session = AsyncMock()

    # Create mock snapshots (oldest to newest)
    # The analyze_trends function queries desc, so index 0 is newest, index -1 is oldest
    snapshot_new = CareerMemorySnapshot(recruiter_confidence=80.0, specialization="Frontend")
    snapshot_mid = CareerMemorySnapshot(recruiter_confidence=60.0, specialization="Frontend")
    snapshot_old = CareerMemorySnapshot(recruiter_confidence=50.0, specialization="Frontend")

    # Result object mock
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [snapshot_new, snapshot_mid, snapshot_old]
    session.execute.return_value = mock_result

    patterns = await analyze_trends(session, "user-123")

    assert len(patterns) == 1
    assert patterns[0].pattern_type == "confidence_growth"
    assert patterns[0].metadata_json["growth"] == 30.0
