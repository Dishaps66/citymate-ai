from datetime import UTC, datetime
from typing import Any

from api.core.config import get_settings
from api.schemas.common import SourceMeta
from api.schemas.records import GeocodeRecord, PlaceRecord, RouteRecord
from api.services.http import fetch_json
from api.services.rules import CATEGORY_TAGS, haversine_m


async def geocode(query: str) -> tuple[list[GeocodeRecord], SourceMeta]:
    settings = get_settings()
    base_url = str(settings.nominatim_base_url).rstrip("/")
    url = f"{base_url}/search"
    retrieved_at = datetime.now(UTC)
    payload = await fetch_json(url, params={"q": query, "format": "jsonv2", "limit": 5, "addressdetails": 1})
    records = [
        GeocodeRecord(
            external_id=f"osm:{item.get('osm_type')}:{item.get('osm_id')}",
            display_name=item["display_name"],
            latitude=float(item["lat"]),
            longitude=float(item["lon"]),
            source="OpenStreetMap Nominatim",
            source_url=url,
            retrieved_at=retrieved_at,
        )
        for item in payload
        if item.get("lat") and item.get("lon") and item.get("display_name")
    ]
    source = SourceMeta(name="OpenStreetMap Nominatim", url=url, retrieved_at=retrieved_at, data_type="live", freshness="live")
    return records, source


def _overpass_query(latitude: float, longitude: float, radius_m: int, category: str) -> str:
    selectors = CATEGORY_TAGS[category]
    blocks = []
    for selector in selectors:
        blocks.append(f"node{selector}(around:{radius_m},{latitude},{longitude});")
        blocks.append(f"way{selector}(around:{radius_m},{latitude},{longitude});")
        blocks.append(f"relation{selector}(around:{radius_m},{latitude},{longitude});")
    return f"[out:json][timeout:25];({''.join(blocks)});out center tags 50;"


async def nearby(latitude: float, longitude: float, category: str, radius_m: int) -> tuple[list[PlaceRecord], SourceMeta]:
    settings = get_settings()
    url = str(settings.overpass_base_url)
    retrieved_at = datetime.now(UTC)
    payload = await fetch_json(url, params={"data": _overpass_query(latitude, longitude, radius_m, category)})
    records: list[PlaceRecord] = []
    seen: set[str] = set()
    for element in payload.get("elements", []):
        tags: dict[str, Any] = element.get("tags") or {}
        name = tags.get("name")
        lat = element.get("lat") or (element.get("center") or {}).get("lat")
        lon = element.get("lon") or (element.get("center") or {}).get("lon")
        external_id = f"osm:{element.get('type')}:{element.get('id')}"
        if not name or lat is None or lon is None or external_id in seen:
            continue
        seen.add(external_id)
        address = ", ".join(
            value for key, value in tags.items() if key.startswith("addr:") and isinstance(value, str)
        ) or None
        records.append(
            PlaceRecord(
                external_id=external_id,
                name=name,
                category=category,
                latitude=float(lat),
                longitude=float(lon),
                address=address,
                distance_m=round(haversine_m(latitude, longitude, float(lat), float(lon)), 1),
                source="OpenStreetMap Overpass",
                source_url=url,
                retrieved_at=retrieved_at,
                verification_status="source_returned",
                opening_hours_status=tags.get("opening_hours"),
                raw_tags=tags,
            )
        )
    records.sort(key=lambda place: place.distance_m or 0)
    source = SourceMeta(name="OpenStreetMap Overpass", url=url, retrieved_at=retrieved_at, data_type="live", freshness="live")
    return records, source


async def route(origin: str, destination: str) -> tuple[RouteRecord | None, list[SourceMeta]]:
    settings = get_settings()
    origin_records, origin_source = await geocode(origin)
    destination_records, destination_source = await geocode(destination)
    if not origin_records or not destination_records:
        return None, [origin_source, destination_source]
    start = origin_records[0]
    end = destination_records[0]
    base_url = str(settings.osrm_base_url).rstrip("/")
    url = f"{base_url}/route/v1/driving/{start.longitude},{start.latitude};{end.longitude},{end.latitude}"
    retrieved_at = datetime.now(UTC)
    payload = await fetch_json(url, params={"overview": "full", "geometries": "geojson", "alternatives": "false"})
    routes = payload.get("routes") or []
    if not routes:
        return None, [origin_source, destination_source]
    best = routes[0]
    record = RouteRecord(
        origin=start,
        destination=end,
        distance_m=float(best["distance"]),
        duration_s=float(best["duration"]),
        geometry=best["geometry"],
        source="OSRM public routing service",
        source_url=url,
        retrieved_at=retrieved_at,
    )
    route_source = SourceMeta(name="OSRM public routing service", url=url, retrieved_at=retrieved_at, data_type="live", freshness="live")
    return record, [origin_source, destination_source, route_source]
