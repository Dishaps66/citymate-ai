"use client";

import { FormEvent, useMemo, useState } from "react";
import { Copy, Crosshair, Download, MapPin, Play, RotateCcw, Save, Search, ShieldAlert, Volume2 } from "lucide-react";
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

type BrowserSpeechRecognition = {
  lang: string;
  onresult: (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void;
  start: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type QueryContext = {
  city: string;
  language: string;
  lifestyle: string;
  budget: number;
  stayPreference: string;
  sharingType: string;
  genderPreference: string;
  amenities: string[];
  typedLocation?: string;
};

const cities = ["Bengaluru", "Hyderabad", "Chennai", "Pune", "Mumbai", "Delhi", "Mysuru"];
const languages = ["English", "Hindi", "Kannada", "Telugu", "Tamil"];
const lifestyles = ["Affordable", "Standard", "Comfort", "Premium"];
const stayPreferences = ["PG", "Hostel", "Room", "Shared flat", "Full flat", "Coliving"];
const sharingTypes = ["Single", "Double sharing", "Triple sharing", "Any sharing"];
const genderPreferences = ["Any", "Women only", "Men only", "Family friendly"];
const amenities = ["WiFi", "Meals", "Laundry", "Power backup", "Parking", "Security", "Attached bathroom"];
const travelModes = ["Road route", "Walking context", "Cycling context", "Public transport availability"];

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

function OptionChips({
  items,
  selected,
  onChange,
  multi = false
}: {
  items: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
}) {
  const selectedList = Array.isArray(selected) ? selected : [selected];
  return (
    <div className="chip-row">
      {items.map((item) => {
        const active = selectedList.includes(item);
        return (
          <button
            className={`chip${active ? " active" : ""}`}
            key={item}
            type="button"
            onClick={() => {
              if (!multi) {
                onChange(item);
                return;
              }
              onChange(active ? selectedList.filter((current) => current !== item) : [...selectedList, item]);
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function SelectionSummary({ context, mode }: { context: QueryContext; mode: QueryMode }) {
  const focus =
    mode === "travel"
      ? "route distance, verified origin/destination, map geometry, and no invented bus numbers"
      : mode === "accommodation"
        ? "verified owner submissions, location fit, stay filters, and unavailable rent/contact fields"
        : mode === "budget"
          ? "salary split, stay budget, food, commute, savings, and emergency buffer"
          : mode === "emergency"
            ? "nearby hospitals, police, fire stations, pharmacies, and emergency-only categories"
            : "source-backed city analysis with unavailable fields clearly marked";

  return (
    <section className="analysis-panel">
      <div>
        <p className="eyebrow">Selections used for analysis</p>
        <h3>{context.city} · {context.language} · {context.lifestyle}</h3>
      </div>
      <div className="selection-grid">
        <span>Budget: INR {context.budget.toLocaleString("en-IN")}</span>
        <span>Stay: {context.stayPreference}</span>
        <span>Sharing: {context.sharingType}</span>
        <span>Preference: {context.genderPreference}</span>
      </div>
      {context.amenities.length ? <p style={{ color: "var(--muted)", margin: 0 }}>Amenities: {context.amenities.join(", ")}</p> : null}
      <p style={{ color: "var(--muted)", margin: 0 }}>Analysis focus: {focus}.</p>
    </section>
  );
}

function ResultActions({ response, title, context }: { response?: ApiResponse<unknown>; title: string; context: QueryContext }) {
  const [saved, setSaved] = useState<string>();

  function serialized() {
    return JSON.stringify({ title, context, response }, null, 2);
  }

  async function copy() {
    if (!response) return;
    await navigator.clipboard?.writeText(serialized());
  }

  function download() {
    if (!response) return;
    const blob = new Blob([serialized()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replaceAll(" ", "-")}-${context.city.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function save() {
    if (!response) return;
    try {
      await postApi("/api/v1/saved-plans", {
        title,
        city: context.city,
        items: [context.typedLocation ?? context.city, ...response.warnings, ...response.unavailable_fields]
      });
      setSaved("Saved plan request sent.");
    } catch (error) {
      setSaved(error instanceof Error ? error.message : "Save failed.");
    }
  }

  return (
    <div className="action-row">
      <button className="btn" disabled={!response} onClick={copy} type="button"><Copy size={16} /> Copy analysis</button>
      <button className="btn" disabled={!response} onClick={download} type="button"><Download size={16} /> Download</button>
      <button className="btn" disabled={!response} onClick={save} type="button"><Save size={16} /> Save plan</button>
      {saved ? <span style={{ color: "var(--muted)" }}>{saved}</span> : null}
    </div>
  );
}

function ResultView({ response, mode, context }: { response?: ApiResponse<unknown>; mode: QueryMode; context: QueryContext }) {
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
        <LocationBadge label="Location typed" value={context.typedLocation} />
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
        <LocationBadge label="Location typed" value={context.typedLocation} />
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
        <LocationBadge label="Search location" value={context.typedLocation || String(response.query.city ?? "")} />
        {listings.length ? (
          <div className="grid">
            {listings.map((listing, index) => (
              <article className="result-card" key={String(listing.id ?? index)}>
                <strong>{String(listing.title ?? "Verified accommodation listing")}</strong>
                <p>{String(listing.city ?? context.typedLocation ?? "City unavailable")}</p>
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
  setContext,
  setError,
  setLoading,
  setResponse,
  setTypedLocation,
  loading
}: {
  endpoint?: string;
  mode: QueryMode;
  setContext: (value: QueryContext) => void;
  setError: (value?: string) => void;
  setLoading: (value: boolean) => void;
  setResponse: (value?: ApiResponse<unknown>) => void;
  setTypedLocation: (value?: string) => void;
  loading: boolean;
}) {
  const [city, setCity] = useState("Bengaluru");
  const [language, setLanguage] = useState("English");
  const [lifestyle, setLifestyle] = useState("Affordable");
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
  const [stayPreference, setStayPreference] = useState("PG");
  const [sharingType, setSharingType] = useState("Any sharing");
  const [genderPreference, setGenderPreference] = useState("Any");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["WiFi", "Security"]);
  const [payload, setPayload] = useState(JSON.stringify(samplePayloads[endpoint ?? ""] ?? {}, null, 2));

  function currentContext(typed?: string): QueryContext {
    return {
      city,
      language,
      lifestyle,
      budget: rent,
      stayPreference,
      sharingType,
      genderPreference,
      amenities: selectedAmenities,
      typedLocation: typed
    };
  }

  async function execute(task: () => Promise<ApiResponse<unknown>>, typed?: string) {
    setLoading(true);
    setError(undefined);
    setTypedLocation(typed);
    setContext(currentContext(typed));
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
    const scopedOrigin = `${origin}, ${city}, India`;
    const scopedDestination = `${destination}, ${city}, India`;
    void execute(() => postApi<RouteRecord | null>("/api/v1/routes", { origin: scopedOrigin, destination: scopedDestination }), `${origin} to ${destination}`);
  }

  function submitPlaces(event: FormEvent) {
    event.preventDefault();
    void execute(async () => {
      const point = await geocodeFirst(`${location}, ${city}, India`);
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
      const point = await geocodeFirst(`${location}, ${city}, India`);
      return await postApi<Record<string, unknown>>("/api/v1/weather", { latitude: point.latitude, longitude: point.longitude });
    }, location);
  }

  function submitAccommodation(event: FormEvent) {
    event.preventDefault();
    void execute(async () => {
      await geocodeFirst(`${location}, ${city}, India`);
      return await getApi<Record<string, unknown>[]>("/api/v1/listings", { city: `${location}, ${city}` });
    }, location);
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const enriched = `${message}\nCity: ${city}. Language: ${language}. Lifestyle: ${lifestyle}. Budget: INR ${rent}. Stay preference: ${stayPreference}.`;
    void execute(() => postApi<Record<string, unknown>>(endpoint ?? "/api/v1/chat", { message: enriched, city, evidence_mode: true }), message);
  }

  function submitBudget(event: FormEvent) {
    event.preventDefault();
    void execute(() => postApi<Record<string, unknown>>("/api/v1/budget-plan", { monthly_income: income, rent, commute, food }), city);
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

  const sharedSelections = (
    <div className="form-grid">
      <div className="grid cols-2">
        <label style={inputStyle()}>City<select className="input" value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label style={inputStyle()}>Language<select className="input" value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label style={inputStyle()}>Lifestyle selection<OptionChips items={lifestyles} selected={lifestyle} onChange={(value) => setLifestyle(String(value))} /></label>
    </div>
  );

  function listen() {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: BrowserSpeechRecognitionConstructor; webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: BrowserSpeechRecognitionConstructor; webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
    };
    recognition.start();
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  }

  if (mode === "travel") {
    return (
      <form className="form-grid" onSubmit={submitTravel}>
        {sharedSelections}
        <label style={inputStyle()}>Travel analysis options<OptionChips items={travelModes} selected={travelModes} multi onChange={() => undefined} /></label>
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
        {sharedSelections}
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
        {sharedSelections}
        <label style={inputStyle()}>{mode === "weather" ? "Weather location" : "PG/room search location"}<input className="input" value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
        {mode === "accommodation" ? (
          <>
            <label style={inputStyle()}>Stay type<OptionChips items={stayPreferences} selected={stayPreference} onChange={(value) => setStayPreference(String(value))} /></label>
            <label style={inputStyle()}>Sharing<OptionChips items={sharingTypes} selected={sharingType} onChange={(value) => setSharingType(String(value))} /></label>
            <label style={inputStyle()}>Gender preference<OptionChips items={genderPreferences} selected={genderPreference} onChange={(value) => setGenderPreference(String(value))} /></label>
            <label style={inputStyle()}>Amenities<OptionChips items={amenities} selected={selectedAmenities} multi onChange={(value) => setSelectedAmenities(value as string[])} /></label>
            <label style={inputStyle()}>Max monthly budget<input className="input" type="number" min={0} value={rent} onChange={(event) => setRent(Number(event.target.value))} /></label>
          </>
        ) : null}
        {mode === "accommodation" ? <p style={{ color: "var(--muted)" }}>Searches verified owner-submitted listings. If none exist, CityMate shows an unavailable state instead of fake PGs, hotels, or rent values.</p> : null}
        {button}
      </form>
    );
  }

  if (mode === "message") {
    return (
      <form className="form-grid" onSubmit={submitMessage}>
        {sharedSelections}
        <label style={inputStyle()}>Your city question<textarea className="input" style={{ minHeight: 150, paddingTop: 12 }} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
        <div className="action-row">
          <button className="btn" type="button" onClick={listen}>Speak</button>
          <button className="btn" type="button" onClick={speak}><Volume2 size={16} /> Read aloud</button>
        </div>
        {button}
      </form>
    );
  }

  if (mode === "budget") {
    return (
      <form className="form-grid" onSubmit={submitBudget}>
        {sharedSelections}
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
  const [context, setContext] = useState<QueryContext>({
    city: "Bengaluru",
    language: "English",
    lifestyle: "Affordable",
    budget: 18000,
    stayPreference: "PG",
    sharingType: "Any sharing",
    genderPreference: "Any",
    amenities: ["WiFi", "Security"]
  });
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
                setContext={setContext}
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
          <SelectionSummary context={{ ...context, typedLocation }} mode={mode} />
          <div style={{ height: 14 }} />
          <ResultView response={response} mode={mode} context={{ ...context, typedLocation }} />
          <ResultActions response={response} title={feature.title} context={{ ...context, typedLocation }} />
        </section>
      </div>

      <div style={{ marginTop: 18 }}>
        <SourcePanel response={response} />
      </div>
    </main>
  );
}
