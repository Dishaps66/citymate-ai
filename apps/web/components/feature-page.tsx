"use client";

import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { postApi } from "@/lib/api";
import { getFeature } from "@/lib/features";
import type { ApiResponse } from "@/types/api";
import { SourcePanel } from "@/components/source-panel";

const samplePayloads: Record<string, Record<string, unknown>> = {
  "/api/v1/chat": { message: "Help me relocate near Electronic City, Bengaluru within INR 18000 rent.", evidence_mode: true },
  "/api/v1/routes": { origin: "MG Road Bengaluru", destination: "Electronic City Bengaluru" },
  "/api/v1/relocation-plan": { message: "Create a relocation checklist for Bengaluru.", evidence_mode: true },
  "/api/v1/listings": { title: "Owner submitted PG near Electronic City", city: "Bengaluru", listing_type: "pg", rent_monthly: 18000, source_url: "https://citymate.local/owner-submission" },
  "/api/v1/budget-plan": { monthly_income: 60000, rent: 18000, commute: 3000, food: 9000 },
  "/api/v1/expenses": { category: "transport", amount: 120, spent_on: "2026-07-14", note: "Metro trial commute" },
  "/api/v1/area-comparison": { message: "Compare Koramangala and Electronic City.", evidence_mode: true },
  "/api/v1/nearby": { latitude: 12.8452, longitude: 77.6602, category: "hospital", radius_m: 1800 },
  "/api/v1/tourist-itinerary": { message: "Build a one day Bengaluru itinerary.", evidence_mode: true },
  "/api/v1/food-search": { message: "Find vegetarian restaurants near Indiranagar.", evidence_mode: true },
  "/api/v1/emergency-search": { latitude: 12.8452, longitude: 77.6602, category: "hospital", radius_m: 1800 },
  "/api/v1/weather": { latitude: 12.9716, longitude: 77.5946 },
  "/api/v1/saved-plans": { title: "Bengaluru move", city: "Bengaluru", items: ["Confirm housing", "Save emergency card"] }
};

export function FeaturePage({ slug }: { slug: string }) {
  const feature = getFeature(slug);
  const endpoint = feature?.endpoint;
  const [payload, setPayload] = useState(JSON.stringify(samplePayloads[endpoint ?? ""] ?? {}, null, 2));
  const [response, setResponse] = useState<ApiResponse<unknown>>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!endpoint) return;
    setLoading(true);
    setError(undefined);
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      setResponse(await postApi<unknown>(endpoint, parsed));
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!feature) {
    return (
      <main className="container" style={{ padding: "34px 0 56px" }}>
        <section className="panel" style={{ padding: 18 }}>
          <h1>Module unavailable</h1>
          <p style={{ color: "var(--muted)" }}>This CityMate module has not been registered.</p>
        </section>
      </main>
    );
  }

  const Icon = feature.icon;

  return (
    <main className="container" style={{ padding: "34px 0 56px" }}>
      <section style={{ display: "grid", gap: 18, marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Icon color="var(--accent)" />
          <p style={{ color: "var(--muted)", margin: 0 }}>{feature.status}</p>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 4.8rem)", lineHeight: 1, margin: 0 }}>{feature.title}</h1>
        <p style={{ color: "var(--muted)", maxWidth: 780, fontSize: 18 }}>{feature.description}</p>
      </section>

      <div className="grid cols-2">
        <section className="panel" style={{ padding: 18 }}>
          <h2>Request</h2>
          {feature.endpoint ? (
            <>
              <p style={{ color: "var(--muted)" }}>{feature.endpoint}</p>
              <textarea className="input" style={{ minHeight: 240, paddingTop: 12 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn primary" onClick={run} disabled={loading}>
                  <Play size={16} /> {loading ? "Running" : "Run verified query"}
                </button>
                <button className="btn" onClick={() => setResponse(undefined)}>
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
              {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
            </>
          ) : (
            <p style={{ color: "var(--muted)" }}>This module is scaffolded for Supabase-backed or provider-backed implementation. It shows no generated city facts until connected to verified data.</p>
          )}
        </section>

        <section className="panel" style={{ padding: 18, overflow: "auto" }}>
          <h2>Result</h2>
          {response ? (
            <pre style={{ whiteSpace: "pre-wrap", color: "var(--muted)" }}>{JSON.stringify(response.data, null, 2)}</pre>
          ) : (
            <p style={{ color: "var(--muted)" }}>No result yet. Empty states are intentional until live data, verified submissions, or calculated values are available.</p>
          )}
        </section>
      </div>

      <div style={{ marginTop: 18 }}>
        <SourcePanel response={response} />
      </div>
    </main>
  );
}
