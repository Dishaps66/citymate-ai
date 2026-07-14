from datetime import date
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from api.schemas.common import ApiResponse

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


class ExpenseRequest(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    amount: float = Field(gt=0)
    spent_on: date
    note: str | None = Field(default=None, max_length=240)


@router.get("")
async def expenses() -> ApiResponse[list[dict]]:
    return ApiResponse(data=[], warnings=["Connect Supabase auth to retrieve user-owned expenses."])


@router.post("")
async def create_expense(request: ExpenseRequest) -> ApiResponse[dict]:
    return ApiResponse(data={"id": str(uuid4()), **request.model_dump(mode="json")}, query=request.model_dump(mode="json"))


@router.patch("/{expense_id}")
async def update_expense(expense_id: str, request: ExpenseRequest) -> ApiResponse[dict]:
    return ApiResponse(data={"id": expense_id, **request.model_dump(mode="json")}, query=request.model_dump(mode="json"))


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str) -> ApiResponse[dict]:
    return ApiResponse(data={"id": expense_id, "deleted": True})


@router.get("/analytics")
async def analytics() -> ApiResponse[dict]:
    return ApiResponse(data={"monthly_total": 0, "categories": [], "trend": []})
