from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from api.schemas.common import ApiResponse, SourceMeta
from api.schemas.requests import ChatRequest
from api.services.planning import budget_scenarios, refusal_for_unsupported_facts

router = APIRouter(prefix="/api/v1", tags=["planning"])


class BudgetRequest(BaseModel):
    monthly_income: float = Field(ge=0)
    rent: float = Field(ge=0)
    commute: float = Field(default=0, ge=0)
    food: float = Field(default=0, ge=0)


class SavedPlanRequest(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    city: str = Field(min_length=2, max_length=120)
    items: list[str] = []


@router.post("/budget-plan")
async def budget_plan(request: BudgetRequest) -> ApiResponse[dict]:
    source = SourceMeta(
        name="CityMate transparent budget formula",
        url="https://github.com/your-org/citymate-ai/docs/API.md",
        retrieved_at=datetime.now(UTC),
        data_type="calculated",
        freshness="live",
        verification_status="formula_calculated",
    )
    return ApiResponse(data=budget_scenarios(**request.model_dump()), query=request.model_dump(), sources=[source])


@router.post("/relocation-plan")
@router.post("/area-comparison")
@router.post("/tourist-itinerary")
@router.post("/food-search")
@router.post("/travel-plan")
async def guarded_planning(request: ChatRequest) -> ApiResponse[dict]:
    return ApiResponse(
        data=refusal_for_unsupported_facts(request.message),
        query=request.model_dump(),
        warnings=["This endpoint needs live provider results or verified user data before returning factual recommendations."],
        unavailable_fields=["source_grounded_recommendations"],
    )


@router.post("/chat")
async def chat(request: ChatRequest) -> ApiResponse[dict]:
    return ApiResponse(
        data=refusal_for_unsupported_facts(request.message),
        query=request.model_dump(),
        warnings=["Gemini/tool-calling is not configured yet; no factual claims were generated."],
        unavailable_fields=["agent_tool_results"],
    )


@router.post("/rag/search")
async def rag_search(request: ChatRequest) -> ApiResponse[dict]:
    return ApiResponse(
        data={"matches": [], "answer": "No source-grounded RAG context was retrieved."},
        query=request.model_dump(),
        warnings=["Connect Supabase pgvector and ingest permitted documents before using RAG answers."],
        unavailable_fields=["rag_context"],
    )


@router.get("/saved-plans")
async def saved_plans() -> ApiResponse[list[dict]]:
    return ApiResponse(data=[], warnings=["Connect Supabase auth to retrieve user-owned saved plans."])


@router.post("/saved-plans")
async def create_saved_plan(request: SavedPlanRequest) -> ApiResponse[dict]:
    return ApiResponse(
        data={"id": str(uuid4()), **request.model_dump(), "status": "requires_supabase_auth_persistence"},
        query=request.model_dump(),
        warnings=["This scaffold returns a typed preview until Supabase persistence is configured."],
    )
