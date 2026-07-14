from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from api.schemas.common import ApiResponse, SourceMeta

router = APIRouter(prefix="/api/v1/listings", tags=["listings"])


class ListingRequest(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    city: str = Field(min_length=2, max_length=120)
    listing_type: Literal["pg", "hostel", "room", "shared_flat", "full_flat"]
    rent_monthly: float = Field(ge=0)
    source_url: str | None = None


@router.get("")
async def get_listings(city: str | None = None) -> ApiResponse[list[dict]]:
    return ApiResponse(
        data=[],
        query={"city": city},
        warnings=["No verified owner-submitted listings are available yet. CityMate AI will not invent accommodation records."],
        unavailable_fields=["verified_owner_submitted_listings"],
    )


@router.post("")
async def create_listing(request: ListingRequest) -> ApiResponse[dict]:
    source = SourceMeta(
        name="Owner submitted listing",
        url=request.source_url or "https://citymate.local/owner-submission",
        retrieved_at=datetime.now(UTC),
        data_type="user_submitted",
        freshness="user_submitted",
        verification_status="verification_pending",
    )
    return ApiResponse(
        data={"id": str(uuid4()), **request.model_dump(), "moderation_status": "pending"},
        query=request.model_dump(),
        sources=[source],
        warnings=["Listing created as a submission preview. Persist and moderate through Supabase before public display."],
    )


@router.patch("/{listing_id}")
async def update_listing(listing_id: str, request: ListingRequest) -> ApiResponse[dict]:
    return ApiResponse(data={"id": listing_id, **request.model_dump(), "moderation_status": "pending_re_review"}, query=request.model_dump())


@router.delete("/{listing_id}")
async def delete_listing(listing_id: str) -> ApiResponse[dict]:
    return ApiResponse(data={"id": listing_id, "deleted": True})


@router.post("/{listing_id}/report")
async def report_listing(listing_id: str) -> ApiResponse[dict]:
    return ApiResponse(data={"id": listing_id, "report_status": "received"})


@router.post("/{listing_id}/verify")
async def verify_listing(listing_id: str) -> ApiResponse[dict]:
    return ApiResponse(data={"id": listing_id, "verification_status": "requires_admin_review"})
