"""Compatibility entrypoint for older commands.

Prefer:
    uvicorn api.main:app --reload

This file keeps `uvicorn app:app` pointed at the active evidence-first API
instead of the legacy placeholder routes.
"""

from api.main import app

__all__ = ["app"]
