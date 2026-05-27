class RecruiterAgent:
    @staticmethod
    def interpret_signals() -> dict:
        return {
            "agent_id": "recruiter",
            "decision_type": "engagement_probability_update",
            "confidence": 0.88,
            "payload": {
                "signal": "Recruiter Interest",
                "details": "Market-level hiring spike for Senior Backend Engineers detected."
            }
        }
