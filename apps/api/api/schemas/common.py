from datetime import UTC, datetime
from typing import Any, Generic, Literal, TypeVar
from uuid import uuid4

from pydantic import BaseModel, Field


DataFreshness = Literal["live", "recent", "stale", "historical", "user_submitted", "unknown"]
DataType = Literal["live", "historical", "user_submitted", "calculated"]


class SourceMeta(BaseModel):
    name: str
    url: str
    retrieved_at: datetime
    data_type: DataType
    freshness: DataFreshness
    verification_status: str = "source_returned"


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    query: dict[str, Any] = Field(default_factory=dict)
    sources: list[SourceMeta] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    unavailable_fields: list[str] = Field(default_factory=list)
    request_id: str = Field(default_factory=lambda: str(uuid4()))


def unavailable_response(query: dict[str, Any], warning: str) -> ApiResponse[list[Any]]:
    return ApiResponse(
        data=[],
        query=query,
        warnings=[warning, "Live verified data is currently unavailable for this location."],
        unavailable_fields=["verified_live_records"],
    )
