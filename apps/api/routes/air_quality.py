from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/air-quality")
async def get_air_quality(
    city: str = Query(..., description="City name")
):
    # Placeholder - implement actual air quality API
    return {
        "city": city,
        "aqi": 42,
        "category": "Good",
        "pollutants": {
            "pm25": 12.5,
            "pm10": 25.3,
            "no2": 8.2,
            "o3": 35.6
        }
    }