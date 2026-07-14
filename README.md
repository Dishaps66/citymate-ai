# CityMate AI

CityMate AI is an evidence-first multi-agent platform for city travel, relocation, verified accommodation, budgeting, emergency support, and urban decision support.

## Problem

People moving through a city often need housing, commute, emergency, weather, budget, and local-place decisions at the same time. Generic chatbots can invent listings, distances, schedules, prices, ratings, and phone numbers. CityMate AI is designed to avoid that failure mode.

## Proposed Solution

The app combines live open-data APIs, verified owner submissions, transparent calculations, Supabase user isolation, and source-grounded AI workflows. When verified data is unavailable, the product displays: `Live verified data is currently unavailable for this location.`

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, TanStack Query, Leaflet-ready maps, Recharts-ready analytics, next-intl-ready localization.
- Backend: FastAPI, Pydantic, HTTPX, async provider adapters, source metadata envelopes, rate-limit hooks, deployment-safe CORS.
- Data/auth: Supabase Auth, PostgreSQL, Row-Level Security, pgvector-ready RAG tables.
- Live sources: OpenStreetMap Nominatim, Overpass API, OSRM, Open-Meteo Forecast and Air Quality.
- AI: LangGraph/Gemini integration points are scaffolded; factual generation is blocked until tool evidence exists.

## Features

- Landing, sign up, sign in, onboarding, dashboard, concierge, travel planner, relocation planner, PG/hostel/flat finders, flat-sharing, flatmate matching, budget planner, expense tracker, area comparison, nearby places, tourist explorer, food explorer, emergency assistance, weather/air, safety/accessibility, saved plans, notifications, profile, owner dashboard, admin dashboard, feedback, and source transparency.
- Evidence Mode shows source names, URLs, timestamps, freshness, warnings, and request IDs.
- Accommodation starts as a first-party verified marketplace, not scraped or invented listings.
- Emergency search is restricted to emergency categories only.

## Local Setup

```powershell
pnpm install
Copy-Item .env.example .env
.\start.ps1
```

Backend:

```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
.\scripts\dev-api.ps1
```

If you start the API manually from the project root, include the app directory:

```powershell
.\apps\api\.venv\Scripts\python.exe -m uvicorn api.main:app --app-dir apps\api --reload --reload-dir apps\api\api --host 0.0.0.0 --port 8000
```

Do not activate `apps\api\venv`; that is an old legacy environment. Use `apps\api\.venv`.

## Environment

Use `.env.example` as the template. Never put service-role keys in `NEXT_PUBLIC_*` variables.

## Testing

```powershell
pnpm --filter @citymate/web typecheck
pnpm --filter @citymate/web lint
pnpm --filter @citymate/web test
cd apps\api
pytest
python -m compileall api
```

## Deployment

- Frontend: Vercel, root `apps/web`, `NEXT_PUBLIC_API_BASE_URL` set to the backend URL.
- Backend: Render or another Python host, root `apps/api`, start command `uvicorn api.main:app --host 0.0.0.0 --port $PORT`.
- Database: Supabase migrations in `supabase/migrations`.
- Full step-by-step deployment instructions are in `docs/DEPLOYMENT.md`.

## Limitations

This scaffold includes the production architecture and initial endpoints, but you still need live Supabase project credentials, Gemini credentials, moderation workflows, and provider quota verification before public launch.
