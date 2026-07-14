"use client";

import { FormEvent, useMemo, useState } from "react";
import { Crosshair, MapPin, Play, RotateCcw, Search, ShieldAlert } from "lucide-react";
import { getApi, postApi } from "@/lib/api";
import { getFeature } from "@/lib/features";
import type { ApiResponse } from "@/types/api";
import { SourcePanel } from "@/components/source-panel";

type GeocodeRecord = {
  external_id: string;
  display_name: string;
  latitude: number;
  longitude: number;
  source: string;
  source_url: string;
  retrieved_at: string;
  verification_status: string;
};

type PlaceRecord = {
  external_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  distance_m?: number | null;
  source: string;
  source_url: string;
  retrieved_at: string;
  verification_status: string;
  opening_hours_status?: string | null;
};

type RouteRecord = {
  origin: GeocodeRecord;
  destination: GeocodeRecord;
  distance_m: number;
  duration_s: number;
  geometry: { coordinates?: [number, number][] };
  source: string;
  source_url: string;
  retrieved_at: string;
  verification_status: string;
};

type QueryMode = "travel" | "places" | "emergency" | "weather" | "accommodation" | "budget" | "message" | "json";

const samplePayloads: Record<string, Record<string, unknown>> = {
  "/api/v1/chat": { message: "Help me relocate near Electronic City, Bengaluru within INR 18000 rent.", evidence_mode: true },
  "/api/v1/routes": { origin: "MG Road Bengaluru", destination: "Electronic City Bengaluru" },
  "/api/v1/relocation-plan": { message: "Create a relocation checklist for Bengaluru.", evidence_mode: true },
  "/api/v1/listings": { city: "Bengaluru" },
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

function modeForSlug(slug: string): QueryMode {
  if (slug === "travel-planner") return "travel";
  if (slug === "pg-finder" || slug === "hostel-finder" || slug === "flat-finder" || slug === "flat-sharing") return "accommodation";
  if (slug === "emergency") return "emergency";
  if (slug === "nearby-places" || slug === "food-explorer" || slug === "tourist-explorer") return "places";
  if (slug === "weather-air") return "weather";
  if (slug === "budget-planner") return "budget";
  if (slug === "concierge" || slug === "relocation-planner" || slug === "area-comparison") return "message";
  return "json";
}

function km(value?: number | null) {
  if (value === undefined || value === null) return "Unknown";
  return `${(value / 1000).toFixed(value > 10000 ? 1 : 2)} km`;
}

function minutes(value?: number | null) {
  if (value === undefined || value === null) return "Unknown";
  return `${Math.max(1, Math.round(value / 60))} min`;
}

function inputStyle() {
  return { display: "grid", gap: 8 };
}

function EvidenceNotice() {
  return (
    <div className="panel" style={{ padding: 14, borderColor: "rgba(45, 212, 191, 0.45)" }}>
      <strong>Live-only accuracy mode</strong>
      <p style={{ color: "var(--muted)", marginBottom: 0 }}>
        Results change with the exact location you type. If CityMate cannot verify a bus route, PG rent, phone number, rating, or safety fact from a source, it marks that field unavailable instead of inventing it.
      </p>
    </div>
  );
}

function MiniMap({ route, places, focus }: { route?: RouteRecord | null; places?: PlaceRecord[]; focus?: GeocodeRecord | null }) {
  const points = useMemo(() => {
    const routePoints = route?.geometry.coordinates?.map(([longitude, latitude]) => ({ latitude, longitude, type: "route" })) ?? [];
    const placePoints = places?.map((place) => ({ latitude: place.latitude, longitude: place.longitude, type: "place" })) ?? [];
    const focusPoint = focus ? [{ latitude: focus.latitude, longitude: focus.longitude, type: "focus" }] : [];
    return [...routePoints, ...placePoints, ...focusPoint];
  }, [focus, places, route]);

  if (!points.length) {
    return (
      <div className="map-preview">
        <MapPin />
        <span>Map appears after live coordinates are returned.</span>
      </div>
    );
  }

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const width = Math.max(maxLng - minLng, 0.001);
  const height = Math.max(maxLat - minLat, 0.001);
  const project = (longitude: number, latitude: number) => ({
    x: 28 + ((longitude - minLng) / width) * 344,
    y: 212 - ((latitude - minLat) / height) * 174
  });
  const routePath = route?.geometry.coordinates
    ?.map(([longitude, latitude], index) => {
      const point = project(longitude, latitude);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="map-preview">
      <svg viewBox="0 0 400 240" role="img" aria-label="Coordinate map preview">
        <rect width="400" height="240" rx="8" fill="#0b1015" />
        <path d="M20 70 C96 28 146 116 224 70 S318 72 380 38" stroke="#1f3b44" strokeWidth="18" fill="none" />
        <path d="M18 176 C112 128 166 214 246 164 S322 122 382 176" stroke="#172f31" strokeWidth="16" fill="none" />
        {routePath ? <path d={routePath} stroke="var(--accent)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {route?.origin ? <circle cx={project(route.origin.longitude, route.origin.latitude).x} cy={project(route.origin.longitude, route.origin.latitude).y} r="7" fill="#22c55e" /> : null}
        {route?.destination ? <circle cx={project(route.destination.longitude, route.destination.latitude).x} cy={project(route.destination.longitude, route.destination.latitude).y} r="7" fill="#f59e0b" /> : null}
        {focus ? <circle cx={project(focus.longitude, focus.latitude).x} cy={project(focus.longitude, focus.latitude).y} r="7" fill="var(--accent)" /> : null}
        {places?.slice(0, 12).map((place) => {
          const point = project(place.longitude, place.latitude);
          return <circle key={place.external_id} cx={point.x} cy={point.y} r="5" fill="#e5e7eb" opacity="0.9" />;
        })}
      </svg>
    </div>
  );
}

function LocationBadge({ label, value }: { label: string; value?: string }) {
  return (
    <div className="location-badge">
      <Crosshair size={15} />
      <span>{label}: </span>
      <strong>{value || "Not entered"}</strong>
    </div>
  );
}

function ResultView({ response, mode, typedLocation }: { response?: ApiResponse<unknown>; mode: QueryMode; typedLocation?: string }) {
  if (!response) {
    return <p style={{ color: "var(--muted)" }}>Run a query. CityMate will only show source-backed or calculated output here.</p>;
  }

  const warnings = response.warnings.length ? (
    <div className="warning-box">
      <ShieldAlert size={18} />
      <span>{response.warnings.join(" ")}</span>
    </div>
  ) : null;

  if (mode === "travel") {
    const route = response.data as RouteRecord | null;
    return (
      <div className="result-stack">
        {warnings}
        <LocationBadge label="Source typed" value={String(response.query.origin ?? "")} />
        <LocationBadge label="Destination typed" value={String(response.query.destination ?? "")} />
        <MiniMap route={route} />
        {route ? (
          <div className="grid cols-2">
            <article className="result-card">
              <strong>Verified origin</strong>
              <p>{route.origin.display_name}</p>
              <small>{route.origin.latitude.toFixed(5)}, {route.origin.longitude.toFixed(5)}</small>
            </article>
            <article className="result-card">
              <strong>Verified destination</strong>
              <p>{route.destination.display_name}</p>
              <small>{route.destination.latitude.toFixed(5)}, {route.destination.longitude.toFixed(5)}</small>
            </article>
            <article className="result-card">
              <strong>Road distance</strong>
              <p>{km(route.distance_m)}</p>
              <small>OSRM route distance, not straight-line distance.</small>
            </article>
            <article className="result-card">
              <strong>Estimated travel time</strong>
              <p>{minutes(route.duration_s)}</p>
              <small>No live traffic or bus schedule is claimed.</small>
            </article>
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Live verified route data is currently unavailable for this source and destination.</p>
        )}
      </div>
    );
  }

  if (mode === "places" || mode === "emergency") {
    const places = response.data as PlaceRecord[];
    return (
      <div className="result-stack">
        {warnings}
        <LocationBadge label="Location typed" value={typedLocation} />
        <MiniMap places={places} />
        {places.length ? (
          <div className="grid">
            {places.map((place) => (
              <article className="result-card" key={place.external_id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{place.name}</strong>
                  <span>{km(place.distance_m)}</span>
                </div>
                <p>{place.address || "Address not available from live source."}</p>
                <small>{place.category} · {place.verification_status} · {place.opening_hours_status || "Opening hours unavailable"}</small>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>No live verified records were returned for this exact location and category.</p>
        )}
      </div>
    );
  }

  if (mode === "weather") {
    const data = response.data as Record<string, unknown>;
    return (
      <div className="result-stack">
        {warnings}
        <LocationBadge label="Location typed" value={typedLocation} />
        <div className="grid cols-2">
          {Object.entries(data).slice(0, 8).map(([key, value]) => (
            <article className="result-card" key={key}>
              <strong>{key.replaceAll("_", " ")}</strong>
              <p>{typeof value === "object" ? JSON.stringify(value) : String(value)}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "accommodation") {
    const listings = response.data as Record<string, unknown>[];
    return (
      <div className="result-stack">
        {warnings}
        <LocationBadge label="Search location" value={typedLocation || String(response.query.city ?? "")} />
        {listings.length ? (
          <div className="grid">
            {listings.map((listing, index) => (
              <article className="result-card" key={String(listing.id ?? index)}>
                <strong>{String(listing.title ?? "Verified accommodation listing")}</strong>
                <p>{String(listing.city ?? typedLocation ?? "City unavailable")}</p>
                <small>{String(listing.listing_type ?? "listing")} · {String(listing.moderation_status ?? "verification required")}</small>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            No verified PG, hostel, room, coliving, or flat listing is available for this location yet. CityMate is not showing hotels or sample listings as real results.
          </p>
        )}
      </div>
    );
  }

  if (mode === "budget") {
    const scenarios = response.data as Record<string, Record<string, unknown>>;
    return (
      <div className="result-stack">
        {warnings}
        <div className="grid cols-3">
          {Object.entries(scenarios).map(([name, scenario]) => (
            <article className="result-card" key={name}>
              <strong>{name}</strong>
              {Object.entries(scenario).slice(0, 6).map(([key, value]) => (
                <p key={key}>{key.replaceAll("_", " ")}: {String(value)}</p>
              ))}
            </article>
          ))}
        </div>
      </div>
    );
  }

  const data = response.data as Record<string, unknown>;
  return (
    <div className="result-stack">
      {warnings}
      {"reason" in data ? <p>{String(data.reason)}</p> : null}
      {"answer" in data ? <p>{String(data.answer)}</p> : null}
      <pre className="json-output">{JSON.stringify(response.data, null, 2)}</pre>
    </div>
  );
}

function FeatureForm({
  endpoint,
  mode,
  setError,
  setLoading,
  setResponse,
  setTypedLocation,
  loading
}: {
  endpoint?: string;
  mode: QueryMode;
  setError: (value?: string) => void;
  setLoading: (value: boolean) => void;
  setResponse: (value?: ApiResponse<unknown>) => void;
  setTypedLocation: (value?: string) => void;
  loading: boolean;
}) {
  const [origin, setOrigin] = useState("MG Road Bengaluru");
  const [destination, setDestination] = useState("Electronic City Bengaluru");
  const [location, setLocation] = useState("Electronic City Bengaluru");
  const [category, setCategory] = useState("hospital");
  const [radius, setRadius] = useState(1800);
  const [message, setMessage] = useState("Compare Koramangala and Electronic City for a student relocation.");
  const [income, setIncome] = useState(60000);
  const [rent, setRent] = useState(18000);
  const [commute, setCommute] = useState(3000);
  const [food, setFood] = useState(9000);
  const [payload, setPayload] = useState(JSON.stringify(samplePayloads[endpoint ?? ""] ?? {}, null, 2));

  async function execute(task: () => Promise<ApiResponse<unknown>>, typed?: string) {
    setLoading(true);
    setError(undefined);
    setTypedLocation(typed);
    try {
      setResponse(await task());
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function geocodeFirst(place: string) {
    const geocode = await postApi<GeocodeRecord[]>("/api/v1/geocode", { query: place });
    const first = geocode.data[0];
    if (!first) {
      throw new Error(`Live verified data is currently unavailable for ${place}.`);
    }
    return first;
  }

  function submitTravel(event: FormEvent) {
    event.preventDefault();
    void execute(() => postApi<RouteRecord | null>("/api/v1/routes", { origin, destination }), `${origin} to ${destination}`);
  }

  function submitPlaces(event: FormEvent) {
    event.preventDefault();
    void execute(async () => {
      const point = await geocodeFirst(location);
      return await postApi<PlaceRecord[]>(mode === "emergency" ? "/api/v1/emergency-search" : "/api/v1/nearby", {
        latitude: point.latitude,
        longitude: point.longitude,
        category,
        radius_m: radius
      });
    }, location);
  }

  function submitWeather(event: FormEvent) {
    event.preventDefault();
    void execute(async () => {
      const point = await geocodeFirst(location);
      return await postApi<Record<string, unknown>>("/api/v1/weather", { latitude: point.latitude, longitude: point.longitude });
    }, location);
  }

  function submitAccommodation(event: FormEvent) {
    event.preventDefault();
    void execute(async () => {
      await geocodeFirst(location);
      return await getApi<Record<string, unknown>[]>("/api/v1/listings", { city: location });
    }, location);
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    void execute(() => postApi<Record<string, unknown>>(endpoint ?? "/api/v1/chat", { message, evidence_mode: true }), message);
  }

  function submitBudget(event: FormEvent) {
    event.preventDefault();
    void execute(() => postApi<Record<string, unknown>>("/api/v1/budget-plan", { monthly_income: income, rent, commute, food }));
  }

  function submitJson(event: FormEvent) {
    event.preventDefault();
    if (!endpoint) return;
    void execute(() => postApi<unknown>(endpoint, JSON.parse(payload) as Record<string, unknown>));
  }

  const button = (
    <button className="btn primary" disabled={loading}>
      <Play size={16} /> {loading ? "Checking live sources" : "Run verified query"}
    </button>
  );

  if (mode === "travel") {
    return (
      <form className="form-grid" onSubmit={submitTravel}>
        <label style={inputStyle()}>Source typed by user<input className="input" value={origin} onChange={(event) => setOrigin(event.target.value)} required /></label>
        <label style={inputStyle()}>Destination typed by user<input className="input" value={destination} onChange={(event) => setDestination(event.target.value)} required /></label>
        {button}
      </form>
    );
  }

  if (mode === "places" || mode === "emergency") {
    const categories = mode === "emergency" ? ["hospital", "police", "fire_station", "pharmacy"] : ["hospital", "police", "fire_station", "pharmacy", "restaurant", "cafe", "tourism", "school", "college", "supermarket", "bank", "atm", "park", "bus_stop", "railway_station"];
    return (
      <form className="form-grid" onSubmit={submitPlaces}>
        <label style={inputStyle()}>Location typed by user<input className="input" value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
        <label style={inputStyle()}>Verified category<select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <label style={inputStyle()}>Radius in metres<input className="input" type="number" min={100} max={5000} value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label>
        {button}
      </form>
    );
  }

  if (mode === "weather" || mode === "accommodation") {
    return (
      <form className="form-grid" onSubmit={mode === "weather" ? submitWeather : submitAccommodation}>
        <label style={inputStyle()}>{mode === "weather" ? "Weather location" : "PG/room search location"}<input className="input" value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
        {mode === "accommodation" ? <p style={{ color: "var(--muted)" }}>Searches verified owner-submitted listings. If none exist, CityMate shows an unavailable state instead of fake PGs, hotels, or rent values.</p> : null}
        {button}
      </form>
    );
  }

  if (mode === "message") {
    return (
      <form className="form-grid" onSubmit={submitMessage}>
        <label style={inputStyle()}>Your city question<textarea className="input" style={{ minHeight: 150, paddingTop: 12 }} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
        {button}
      </form>
    );
  }

  if (mode === "budget") {
    return (
      <form className="form-grid" onSubmit={submitBudget}>
        <label style={inputStyle()}>Monthly income<input className="input" type="number" min={0} value={income} onChange={(event) => setIncome(Number(event.target.value))} /></label>
        <label style={inputStyle()}>Rent or stay budget<input className="input" type="number" min={0} value={rent} onChange={(event) => setRent(Number(event.target.value))} /></label>
        <label style={inputStyle()}>Commute estimate<input className="input" type="number" min={0} value={commute} onChange={(event) => setCommute(Number(event.target.value))} /></label>
        <label style={inputStyle()}>Food estimate<input className="input" type="number" min={0} value={food} onChange={(event) => setFood(Number(event.target.value))} /></label>
        {button}
      </form>
    );
  }

  return (
    <form className="form-grid" onSubmit={submitJson}>
      <textarea className="input" style={{ minHeight: 240, paddingTop: 12 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
      {button}
    </form>
  );
}

export function FeaturePage({ slug }: { slug: string }) {
  const feature = getFeature(slug);
  const mode = modeForSlug(slug);
  const [response, setResponse] = useState<ApiResponse<unknown>>();
  const [typedLocation, setTypedLocation] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

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
        <EvidenceNotice />
      </section>

      <div className="grid cols-2">
        <section className="panel" style={{ padding: 18 }}>
          <h2><Search size={20} /> Query</h2>
          {feature.endpoint ? (
            <>
              <p style={{ color: "var(--muted)" }}>Connected endpoint: {feature.endpoint}</p>
              <FeatureForm
                endpoint={feature.endpoint}
                mode={mode}
                loading={loading}
                setError={setError}
                setLoading={setLoading}
                setResponse={setResponse}
                setTypedLocation={setTypedLocation}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn" onClick={() => { setResponse(undefined); setError(undefined); }} type="button">
                  <RotateCcw size={16} /> Clear result
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
          <ResultView response={response} mode={mode} typedLocation={typedLocation} />
        </section>
      </div>

      <div style={{ marginTop: 18 }}>
        <SourcePanel response={response} />
      </div>
    </main>
  );
}
