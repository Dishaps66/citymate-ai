from datetime import datetime
from typing import Any

from pydantic import BaseModel


class PlaceRecord(BaseModel):
    external_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    address: str | None = None
    distance_m: float | None = None
    source: str
    source_url: str
    retrieved_at: datetime
    verification_status: str
    opening_hours_status: str | None = None
    raw_tags: dict[str, Any] = {}


class GeocodeRecord(BaseModel):
    external_id: str
    display_name: str
    latitude: float
    longitude: float
    source: str
    source_url: str
    retrieved_at: datetime
    verification_status: str = "source_returned"


class RouteRecord(BaseModel):
    origin: GeocodeRecord
    destination: GeocodeRecord
    distance_m: float
    duration_s: float
    geometry: dict[str, Any]
    source: str
    source_url: str
    retrieved_at: datetime
    verification_status: str = "source_returned"
