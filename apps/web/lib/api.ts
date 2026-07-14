import type { ApiResponse } from "@/types/api";

export function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
  return value.replace(/\/$/, "");
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    throw new Error(`CityMate API returned ${response.status}. Check backend URL and CORS settings.`);
  }
  return (await response.json()) as ApiResponse<T>;
}

export async function postApi<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    return await parseApiResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("CityMate API timed out. Try a smaller area or check whether the backend is awake.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getApi<T>(path: string, query?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  try {
    const response = await fetch(`${apiBaseUrl()}${path}${suffix}`, {
      method: "GET",
      signal: controller.signal
    });
    return await parseApiResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("CityMate API timed out. Try again after the backend finishes waking up.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
