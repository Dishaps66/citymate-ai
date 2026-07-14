from typing import Any


UNAVAILABLE = "Live verified data is currently unavailable for this location."


def budget_scenarios(monthly_income: float, rent: float, commute: float = 0, food: float = 0) -> dict[str, Any]:
    essentials = rent + commute + food
    emergency = max(monthly_income * 0.1, 0)
    flexible = max(monthly_income - essentials - emergency, 0)
    return {
        "affordable": {
            "rent_limit": round(monthly_income * 0.25, 2),
            "emergency_savings": round(emergency, 2),
            "flexible_spend": round(flexible, 2),
            "data_type": "calculated",
        },
        "balanced": {
            "rent_limit": round(monthly_income * 0.33, 2),
            "emergency_savings": round(monthly_income * 0.12, 2),
            "flexible_spend": round(max(monthly_income - essentials - monthly_income * 0.12, 0), 2),
            "data_type": "calculated",
        },
        "comfortable": {
            "rent_limit": round(monthly_income * 0.4, 2),
            "emergency_savings": round(monthly_income * 0.15, 2),
            "flexible_spend": round(max(monthly_income - essentials - monthly_income * 0.15, 0), 2),
            "data_type": "calculated",
        },
    }


def refusal_for_unsupported_facts(message: str) -> dict[str, Any]:
    return {
        "answer": UNAVAILABLE,
        "reason": "CityMate AI cannot invent factual city records, listings, phone numbers, ratings, schedules, or prices.",
        "next_steps": [
            "Try a live geocode, nearby, weather, route, or verified listing search.",
            "Enable Evidence Mode to inspect sources and timestamps.",
        ],
        "user_message": message,
    }
