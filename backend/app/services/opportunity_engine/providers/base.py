"""Abstract Base Class for Opportunity Providers."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseOpportunityProvider(ABC):
    @abstractmethod
    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        """Fetch raw job opportunity records from the provider API asynchronously."""
        pass

    @abstractmethod
    def normalize(self, raw_job: Any) -> Dict[str, Any]:
        """Normalize raw provider data structures into unified opportunity schema."""
        pass
