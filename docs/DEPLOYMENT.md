# Deployment Guide

CityMate AI deploys as three connected services:

- Supabase for PostgreSQL, Auth, RLS, and pgvector-ready tables.
- Render for the FastAPI backend.
- Vercel for the Next.js frontend.

Do not deploy with placeholder secrets. Never put `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, or `GOOGLE_API_KEY` in Vercel `NEXT_PUBLIC_*` variables.

## 1. Local Verification

From the repository root:

```powershell
pnpm install
pnpm --filter @citymate/web typecheck
pnpm --filter @citymate/web lint
pnpm --filter @citymate/web test
pnpm --filter @citymate/web build

cd apps\api
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m compileall api
cd ..\..
```

Linux/macOS equivalent:

```bash
pnpm install
pnpm --filter @citymate/web typecheck
pnpm --filter @citymate/web lint
pnpm --filter @citymate/web test
pnpm --filter @citymate/web build

cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m pytest
python -m compileall api
cd ../..
```

## 2. Supabase Setup

1. Create a Supabase project.
2. Enable Email/Password auth and Google OAuth if you want Google sign-in.
3. Open the SQL editor and run `supabase/migrations/202607140001_citymate_foundation.sql`.
4. Confirm RLS is enabled on user-owned tables.
5. Copy the project URL, anon key, service role key, and JWT secret.
6. In Supabase Auth settings, add the production Vercel URL to allowed redirect URLs after the frontend is deployed.

Local Supabase CLI usage is optional. If you use it:

```powershell
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

## 3. Backend on Render

Create a new Render Web Service connected to the GitHub repository.

Render settings:

```text
Root directory: apps/api
Runtime: Python 3
Build command: pip install -r requirements.txt
Start command: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

Backend environment variables:

```env
APP_ENV=production
APP_VERSION=1.0.0
FRONTEND_ORIGINS=https://your-frontend.vercel.app
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
GOOGLE_API_KEY=...
APP_USER_AGENT=CityMateAI/1.0 your-email@example.com
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OVERPASS_BASE_URL=https://overpass-api.de/api/interpreter
OSRM_BASE_URL=https://router.project-osrm.org
OPEN_METEO_BASE_URL=https://api.open-meteo.com
OPEN_METEO_AIR_BASE_URL=https://air-quality-api.open-meteo.com
```

After Render deploys, verify:

```text
https://your-api.onrender.com/health
https://your-api.onrender.com/docs
```

The `/health` endpoint should return a healthy CityMate AI API response.

## 4. Frontend on Vercel

Create a new Vercel project connected to the same GitHub repository.

Vercel settings:

```text
Framework preset: Next.js
Root directory: apps/web
Install command: pnpm install
Build command: pnpm build
Output directory: .next
```

Frontend environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Deploy once, then copy the Vercel production URL back into:

- Render `FRONTEND_ORIGINS`
- Supabase Auth redirect URLs

Redeploy the backend after updating `FRONTEND_ORIGINS`.

## 5. Production Smoke Test

1. Open the Vercel production URL.
2. Check `/signin` and `/signup` validation.
3. Check `/dashboard`, `/travel-planner`, `/nearby-places`, `/weather-air`, `/emergency`, and `/transparency`.
4. Open `https://your-api.onrender.com/docs` and test `/api/v1/geocode`, `/api/v1/weather`, and `/api/v1/emergency-search`.
5. Confirm every live result includes sources and timestamps.
6. Disable or break a provider URL temporarily in Render and confirm the API returns an unavailable warning instead of fake data.
7. Confirm no secret values appear in browser dev tools or committed files.
