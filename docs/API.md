# API Documentation

All versioned endpoints return:

```json
{
  "success": true,
  "data": [],
  "generated_at": "ISO timestamp",
  "query": {},
  "sources": [],
  "warnings": [],
  "unavailable_fields": [],
  "request_id": "UUID"
}
```

## Live Data

- `GET /health`
- `GET|POST /api/v1/sources/status`
- `POST /api/v1/geocode`
- `POST /api/v1/nearby`
- `POST /api/v1/routes`
- `POST /api/v1/weather`
- `POST /api/v1/air-quality`
- `POST /api/v1/emergency-search`

## Planning and Agents

- `POST /api/v1/chat`
- `POST /api/v1/rag/search`
- `POST /api/v1/travel-plan`
- `POST /api/v1/relocation-plan`
- `POST /api/v1/budget-plan`
- `POST /api/v1/area-comparison`
- `POST /api/v1/tourist-itinerary`
- `POST /api/v1/food-search`

Agent endpoints currently refuse unsupported factual output until live tools or verified Supabase records provide evidence.

## User Data

- `/api/v1/listings`
- `/api/v1/saved-plans`
- `/api/v1/expenses`

The scaffold has typed preview handlers. Production persistence should validate Supabase JWTs and write `user_id` on the server.
