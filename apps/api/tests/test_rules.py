from api.services.planning import budget_scenarios, refusal_for_unsupported_facts
from api.services.rules import CATEGORY_TAGS, haversine_m


def test_emergency_categories_do_not_include_restaurants() -> None:
    emergency = {"hospital", "police", "fire_station", "pharmacy"}
    for category in emergency:
        assert "restaurant" not in "".join(CATEGORY_TAGS[category])


def test_haversine_returns_real_distance_not_zero() -> None:
    distance = haversine_m(12.9716, 77.5946, 12.9352, 77.6245)
    assert distance > 1000


def test_budget_scenarios_are_calculated() -> None:
    scenarios = budget_scenarios(monthly_income=60000, rent=18000, commute=3000, food=9000)
    assert scenarios["affordable"]["data_type"] == "calculated"
    assert scenarios["balanced"]["rent_limit"] == 19800


def test_chat_refuses_unsupported_facts() -> None:
    refusal = refusal_for_unsupported_facts("Invent five PGs")
    assert "cannot invent" in refusal["reason"]
