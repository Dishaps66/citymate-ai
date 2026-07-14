from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.core.config import get_settings
from api.routers import expenses, listings, live_data, planning, public, sources

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CityMate AI API",
    description="Evidence-first city intelligence API. Failed providers return unavailable states, never fabricated records.",
    version=settings.app_version,
)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if settings.app_env != "production" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"success": False, "error": "Rate limit exceeded", "detail": str(exc)})


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(self)"
    return response


app.include_router(public.router)
app.include_router(sources.router)
app.include_router(live_data.router)
app.include_router(planning.router)
app.include_router(listings.router)
app.include_router(expenses.router)
