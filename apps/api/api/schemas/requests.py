from typing import Literal

from pydantic import BaseModel, Field


class GeocodeRequest(BaseModel):
    query: str = Field(min_length=2, max_length=240)


class NearbyRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    category: Literal[
        "hospital",
        "police",
        "fire_station",
        "pharmacy",
        "restaurant",
        "cafe",
        "tourism",
        "school",
        "college",
        "supermarket",
        "bank",
        "atm",
        "park",
        "bus_stop",
        "railway_station",
    ]
    radius_m: int = Field(default=1500, ge=100, le=5000)


class RouteRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=240)
    destination: str = Field(min_length=2, max_length=240)


class WeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)
    city: str | None = Field(default=None, max_length=120)
    evidence_mode: bool = False
