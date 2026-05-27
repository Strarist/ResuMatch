import asyncio
import random
from typing import Dict, Any
from app.services.agents.shared.event_bus import runtime_bus
from app.services.agents.recruiter_agent.engine import RecruiterAgent
from app.services.agents.execution_agent.planner import ExecutionAgent
from app.services.agents.market_agent.trends import MarketAgent
from app.services.agents.memory_agent.consolidation import MemoryAgent

class OrchestratorCoordinator:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = OrchestratorCoordinator()
        return cls._instance

    def __init__(self):
        self.cycle_count = 0
        self.is_running = False
        self.latest_cycle_payload = None

    async def start_orchestration_loop(self):
        if self.is_running:
            return
        self.is_running = True

        while True:
            await asyncio.sleep(random.uniform(5.0, 10.0))
            self.cycle_count += 1

            # 1. Intake & Interpretation
            decisions = [
                RecruiterAgent.interpret_signals(),
                ExecutionAgent.evaluate_leverage(),
                MarketAgent.forecast_trends(),
                MemoryAgent.consolidate()
            ]

            # 2. Arbitration (Simulated logic picking the highest confidence)
            highest_leverage_decision = max(decisions, key=lambda d: d["confidence"])

            # 3. Resolution & Propagation Constraints
            active_agents = [{"agent_id": d["agent_id"], "status": "processed"} for d in decisions]

            # 4. Directive Generation
            directive = {
                "directive_type": "Strategic Shift",
                "description": highest_leverage_decision["payload"]["details"],
                "rationale": f"Arbitrated {len(decisions)} agent signals. Selected {highest_leverage_decision['agent_id']} due to high confidence.",
                "priority_level": "High"
            }

            cycle_payload = {
                "cycle_number": self.cycle_count,
                "active_agents": active_agents,
                "directive": directive,
                "agent_activity": decisions
            }

            # 5. Emission
            self.latest_cycle_payload = cycle_payload
            await runtime_bus.publish("orchestration_cycle", cycle_payload)
