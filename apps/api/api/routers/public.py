from fastapi import APIRouter

from api.core.config import get_settings

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    return {"service": "CityMate AI API", "status": "healthy", "version": settings.app_version}
