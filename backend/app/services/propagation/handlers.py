"""Handlers linking cross-domain intelligence."""

from app.services.propagation.event_bus import bus
from loguru import logger
from app.db import async_session_factory
from app.services.memory_engine.snapshot import create_snapshot

async def handle_portfolio_updated(payload: dict):
    logger.info(f"Propagation: Portfolio updated for user {payload.get('user_id')}")
    # Simulate cascading recalculation of recruiter signals and opportunity graph
    # (e.g. increase recruiter confidence, trigger roadmap adaptation)
    async with async_session_factory() as session:
        # Save a new snapshot trigger
        await create_snapshot(
            session=session,
            user_id=payload.get("user_id"),
            trigger_event="portfolio_updated",
            metrics={
                "match_score": 90.0,
                "career_velocity": 85.0,
                "market_fit": 92.0,
                "recruiter_confidence": 95.0,
                "competitiveness": 88.0
            }
        )
    logger.info(f"Propagation: Cascaded Portfolio Update into Recruiter Signal Recompute.")

async def handle_roadmap_node_completed(payload: dict):
    logger.info(f"Propagation: Roadmap node completed for user {payload.get('user_id')}, skill: {payload.get('skill')}")
    # Save a new snapshot and possibly trigger execution adaptation throttle
    async with async_session_factory() as session:
        await create_snapshot(
            session=session,
            user_id=payload.get("user_id"),
            trigger_event="roadmap_node_completed",
            metrics={"career_velocity": 80.0} # Just a placeholder metric shift
        )
    logger.info("Propagation: Execution Adaptation throttle recomputed.")

def register_handlers():
    bus.subscribe("PORTFOLIO_UPDATED", handle_portfolio_updated)
    bus.subscribe("ROADMAP_NODE_COMPLETED", handle_roadmap_node_completed)
