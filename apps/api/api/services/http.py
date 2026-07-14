from collections.abc import Mapping
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from api.core.config import get_settings


class ProviderError(RuntimeError):
    pass


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.3, min=0.3, max=2))
async def fetch_json(url: str, *, params: Mapping[str, Any] | None = None) -> Any:
    settings = get_settings()
    headers = {"User-Agent": settings.app_user_agent, "Accept": "application/json"}
    timeout = httpx.Timeout(12.0, connect=5.0)
    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url, params=params)
        if response.status_code >= 500:
            raise ProviderError(f"Provider returned {response.status_code}")
        if response.status_code >= 400:
            raise ProviderError(f"Provider rejected request with {response.status_code}")
        return response.json()
