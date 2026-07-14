from datetime import UTC, datetime

from fastapi import APIRouter

from api.schemas.common import ApiResponse

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("/status")
@router.post("/status")
async def source_status() -> ApiResponse[list[dict]]:
    now = datetime.now(UTC).isoformat()
    providers = [
        {"name": "OpenStreetMap Nominatim", "status": "configured", "last_checked_at": now, "cache": "planned"},
        {"name": "OpenStreetMap Overpass", "status": "configured", "last_checked_at": now, "cache": "planned"},
        {"name": "OSRM public routing service", "status": "configured", "last_checked_at": now, "cache": "planned"},
        {"name": "Open-Meteo Forecast API", "status": "configured", "last_checked_at": now, "cache": "planned"},
        {"name": "Supabase verified listings", "status": "requires_project_credentials", "last_checked_at": now, "cache": "database"},
        {"name": "Gemini tool-calling agents", "status": "requires_api_key", "last_checked_at": now, "cache": "not_applicable"},
    ]
    return ApiResponse(data=providers)
