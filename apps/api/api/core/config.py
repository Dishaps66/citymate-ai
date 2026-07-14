from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: Literal["development", "test", "production"] = "development"
    app_version: str = "1.0.0"
    app_user_agent: str = "CityMateAI/1.0 contact@example.com"
    frontend_origins: str = "http://localhost:3000"
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    google_api_key: str | None = None
    nominatim_base_url: AnyHttpUrl = Field("https://nominatim.openstreetmap.org")
    overpass_base_url: AnyHttpUrl = Field("https://overpass-api.de/api/interpreter")
    osrm_base_url: AnyHttpUrl = Field("https://router.project-osrm.org")
    open_meteo_base_url: AnyHttpUrl = Field("https://api.open-meteo.com")
    open_meteo_air_base_url: AnyHttpUrl = Field("https://air-quality-api.open-meteo.com")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
