"""Opportunity Providers Registry."""

from typing import List
from app.services.opportunity_engine.providers.base import BaseOpportunityProvider
from app.services.opportunity_engine.providers.remoteok import RemoteOKProvider
from app.services.opportunity_engine.providers.arbeitnow import ArbeitnowProvider

def get_providers() -> List[BaseOpportunityProvider]:
    """Exposes all supported live job board crawlers."""
    return [
        RemoteOKProvider(),
        ArbeitnowProvider()
    ]
