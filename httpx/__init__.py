"""Compatibility shim for older httpx versions.

Provides an ``AsyncClient`` that accepts the ``app`` keyword argument used in
the test suite. Internally it forwards to the real ``httpx.AsyncClient`` with an
``ASGITransport``.
"""

from __future__ import annotations

import typing as _t

# Compatibility shim for older httpx usage in tests.
# This file lives in the repository root "httpx" package, which appears on
# ``sys.path`` before the real ``httpx`` distribution installed in the virtual
# environment. Importing ``httpx`` directly would therefore re-import this shim
# and cause a circular import. To avoid that, we temporarily remove the project
# directory from ``sys.path`` and, if necessary, purge the partially‑initialised
# shim from ``sys.modules`` before importing the genuine library.

import importlib
import sys
import os

# Preserve the original import state
_original_sys_path = list(sys.path)
_original_module = sys.modules.get("httpx")

# Exclude the workspace root (current working directory) from the import search
_workspace_root = os.getcwd()
sys.path = [p for p in sys.path if p and p != _workspace_root]

# If the current ``httpx`` entry refers to this shim, delete it so the real
# package can be loaded.
if _original_module is not None and getattr(_original_module, "__file__", "").endswith("__init__.py") and "httpx" in _original_module.__name__:
    del sys.modules["httpx"]

try:
    _real_httpx = importlib.import_module("httpx")
finally:
    # Restore original import environment
    sys.path = _original_sys_path
    if _original_module is not None:
        sys.modules["httpx"] = _original_module

# Export the symbols expected by the test suite.
AsyncClientBase = _real_httpx.AsyncClient
ASGITransport = getattr(_real_httpx, "ASGITransport", None)


class AsyncClient(AsyncClientBase):
    """Thin wrapper adding ``app`` support.

    The original test invokes ``AsyncClient(app=app, base_url=...)``. Newer
    versions of ``httpx`` accept ``transport=ASGITransport(app=app)`` instead.
    This subclass mirrors the older signature while delegating to the base
    implementation.
    """

    def __init__(self, *args: _t.Any, app: _t.Any = None, **kwargs: _t.Any):  # noqa: D401
        if app is not None:
            if ASGITransport is None:
                raise RuntimeError("httpx.ASGITransport not available in this httpx version")
            # Insert transport if not already provided
            kwargs.setdefault("transport", ASGITransport(app=app))
        super().__init__(*args, **kwargs)

# Export all public attributes from the real httpx module so that imports expecting
# constants like ``USE_CLIENT_DEFAULT`` continue to work.
for _name in dir(_real_httpx):
    if _name.isupper() or not _name.startswith("_"):
        if _name not in globals():
            globals()[_name] = getattr(_real_httpx, _name)
