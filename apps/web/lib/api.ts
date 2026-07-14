import type { ApiResponse } from "@/types/api";

export function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
  return value.replace(/\/$/, "");
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
    if (!response.ok) {
      throw new Error(`CityMate API returned ${response.status}`);
    }
    return (await response.json()) as ApiResponse<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}
