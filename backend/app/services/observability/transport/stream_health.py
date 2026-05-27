from typing import Dict, Any
from app.services.observability.shared.diagnostics_protocols import DiagnosticsProvider
from app.services.observability.shared.observability_models import TransportHealth
from app.services.observability.transport.reconnect_diagnostics import ReconnectDiagnosticsTracker
from app.services.observability.transport.synchronization_audit import StreamSynchronizationAuditor
from app.services.observability.transport.payload_integrity import PayloadIntegrityScanner

class TransportObservabilityLayer(DiagnosticsProvider):
    """Main transport system coordinator auditing stream health and network stability."""

    def diagnose(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs transport health diagnostics and audits synchronization delays.
        
        Args:
            data (Dict[str, Any]): Transport diagnostics payload containing:
                - disconnect_timestamps (List[float]): Connection loss history.
                - sync_delays_ms (List[float]): Synchronization latency lists.
                - payload_events (List[Dict[str, Any]]): Serialized payload checks.
                - uptime_ratio (float): Stream uptime coefficient.
                - heartbeat_quality (float): Connection status index.
        """
        disconnects = data.get("disconnect_timestamps", [])
        sync_delays = data.get("sync_delays_ms", [])
        payload_events = data.get("payload_events", [])
        uptime_ratio = data.get("uptime_ratio", 0.99)
        heartbeat_quality = data.get("heartbeat_quality", 0.95)

        # 1. Run sub-auditors
        reconnect_info = ReconnectDiagnosticsTracker.audit_reconnects(disconnects)
        sync_info = StreamSynchronizationAuditor.audit_synchronization(sync_delays)
        payload_info = PayloadIntegrityScanner.scan_payloads(payload_events)

        # 2. Package into TransportHealth Pydantic output
        health = TransportHealth(
            uptime_ratio=uptime_ratio,
            reconnect_frequency=reconnect_info["reconnect_frequency_per_hr"],
            payload_corruption_rate=payload_info["corruption_rate"],
            synchronization_delay_ms=sync_info["average_delay_ms"],
            heartbeat_quality=heartbeat_quality
        )

        return health.model_dump()
