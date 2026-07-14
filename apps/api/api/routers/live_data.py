from fastapi import APIRouter

from api.schemas.common import ApiResponse, unavailable_response
from api.schemas.records import GeocodeRecord, PlaceRecord, RouteRecord
from api.schemas.requests import GeocodeRequest, NearbyRequest, RouteRequest, WeatherRequest
from api.services.geo import geocode, nearby, route
from api.services.http import ProviderError
from api.services.weather import air_quality, weather

router = APIRouter(prefix="/api/v1", tags=["live-data"])


@router.post("/geocode", response_model=ApiResponse[list[GeocodeRecord]])
async def geocode_endpoint(request: GeocodeRequest) -> ApiResponse[list[GeocodeRecord]]:
    try:
        records, source = await geocode(request.query)
    except ProviderError as error:
        return unavailable_response(request.model_dump(), str(error))
    warnings = [] if records else ["Live verified data is currently unavailable for this location."]
    return ApiResponse(data=records, query=request.model_dump(), sources=[source], warnings=warnings)


@router.post("/nearby", response_model=ApiResponse[list[PlaceRecord]])
async def nearby_endpoint(request: NearbyRequest) -> ApiResponse[list[PlaceRecord]]:
    try:
        records, source = await nearby(request.latitude, request.longitude, request.category, request.radius_m)
    except ProviderError as error:
        return unavailable_response(request.model_dump(), str(error))
    warnings = [] if records else ["Live verified data is currently unavailable for this location."]
    return ApiResponse(data=records, query=request.model_dump(), sources=[source], warnings=warnings)


@router.post("/emergency-search", response_model=ApiResponse[list[PlaceRecord]])
async def emergency_search_endpoint(request: NearbyRequest) -> ApiResponse[list[PlaceRecord]]:
    if request.category not in {"hospital", "police", "fire_station", "pharmacy"}:
        return ApiResponse(
            data=[],
            query=request.model_dump(),
            warnings=["Emergency search only accepts hospital, police, fire_station, or pharmacy categories."],
            unavailable_fields=["non_emergency_category"],
        )
    return await nearby_endpoint(request)


@router.post("/routes", response_model=ApiResponse[RouteRecord | None])
async def routes_endpoint(request: RouteRequest) -> ApiResponse[RouteRecord | None]:
    try:
        record, sources = await route(request.origin, request.destination)
    except ProviderError as error:
        response = unavailable_response(request.model_dump(), str(error))
        return ApiResponse(data=None, query=response.query, warnings=response.warnings, unavailable_fields=response.unavailable_fields)
    warnings = [] if record else ["Live verified routing data is currently unavailable for this location."]
    return ApiResponse(data=record, query=request.model_dump(), sources=sources, warnings=warnings)


@router.post("/weather", response_model=ApiResponse[dict])
async def weather_endpoint(request: WeatherRequest) -> ApiResponse[dict]:
    try:
        data, source = await weather(request.latitude, request.longitude)
    except ProviderError as error:
        return ApiResponse(data={}, query=request.model_dump(), warnings=[str(error), "Live verified data is currently unavailable for this location."])
    return ApiResponse(data=data, query=request.model_dump(), sources=[source])


@router.post("/air-quality", response_model=ApiResponse[dict])
async def air_quality_endpoint(request: WeatherRequest) -> ApiResponse[dict]:
    try:
        data, source = await air_quality(request.latitude, request.longitude)
    except ProviderError as error:
        return ApiResponse(data={}, query=request.model_dump(), warnings=[str(error), "Live verified data is currently unavailable for this location."])
    return ApiResponse(data=data, query=request.model_dump(), sources=[source])
