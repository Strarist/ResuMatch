from typing import Dict, Any

class ResilienceOptimizer:
    @staticmethod
    def optimize_resilience(stable_epochs: int) -> Dict[str, Any]:
        """
        Calibrates retry limits and cooldown windows based on uninterrupted stable cycles.
        """
        # If highly stable, extend connection retry cooling intervals to prevent chatters
        cooldown = 30.0
        if stable_epochs >= 10:
            cooldown = 60.0
        elif stable_epochs >= 5:
            cooldown = 45.0
            
        return {
            "stable_epochs": stable_epochs,
            "optimized_cooldown_seconds": cooldown,
            "action_taken": f"Set connection retry recovery pacing cooldown to {cooldown}s based on {stable_epochs} stable epochs."
        }
