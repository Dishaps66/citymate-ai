from datetime import UTC, datetime
from typing import Any

from api.core.config import get_settings
from api.schemas.common import SourceMeta
from api.services.http import fetch_json


async def weather(latitude: float, longitude: float) -> tuple[dict[str, Any], SourceMeta]:
    settings = get_settings()
    base_url = str(settings.open_meteo_base_url).rstrip("/")
    url = f"{base_url}/v1/forecast"
    retrieved_at = datetime.now(UTC)
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation_probability,uv_index",
        "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset",
        "timezone": "auto",
        "forecast_days": 3,
    }
    payload = await fetch_json(url, params=params)
    source = SourceMeta(name="Open-Meteo Forecast API", url=url, retrieved_at=retrieved_at, data_type="live", freshness="live")
    return payload, source


async def air_quality(latitude: float, longitude: float) -> tuple[dict[str, Any], SourceMeta]:
    settings = get_settings()
    base_url = str(settings.open_meteo_air_base_url).rstrip("/")
    url = f"{base_url}/v1/air-quality"
    retrieved_at = datetime.now(UTC)
    payload = await fetch_json(
        url,
        params={
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,uv_index",
            "timezone": "auto",
            "forecast_days": 1,
        },
    )
    source = SourceMeta(name="Open-Meteo Air Quality API", url=url, retrieved_at=retrieved_at, data_type="live", freshness="live")
    return payload, source
