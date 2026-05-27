def serialize_event(event: dict) -> str:
    """Serializes an event payload consistently for drift analysis."""
    import json
    return json.dumps(event, sort_keys=True)
