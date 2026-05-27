from typing import Dict, Any

class ConcurrencyBalancer:
    """Balances async loop execution loads and monitors active process queues."""

    @staticmethod
    def audit_balance(active_tasks: int, max_tasks: int = 100) -> Dict[str, Any]:
        """
        Balances CPU process workloads and calculates task distributions.
        
        Args:
            active_tasks (int): Concurrency scheduled tasks.
            max_tasks (int): Capacity limit.
        """
        load_ratio = active_tasks / max_tasks
        needs_balancing = load_ratio >= 0.80

        # Suggested workers count: allocate more workers if load is heavy
        suggested_workers = 4 if needs_balancing else 2

        return {
            "load_ratio": round(load_ratio, 3),
            "needs_balancing": needs_balancing,
            "suggested_workers": suggested_workers
        }
