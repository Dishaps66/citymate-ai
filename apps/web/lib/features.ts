import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  CircleDollarSign,
  CloudSun,
  Compass,
  Home,
  Hospital,
  Landmark,
  Map,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";

export type Feature = {
  slug: string;
  title: string;
  description: string;
  endpoint?: string;
  status: "live-api" | "supabase" | "agent" | "calculated" | "planned";
  icon: typeof Home;
};

export const features: Feature[] = [
  { slug: "dashboard", title: "Dashboard", description: "Your readiness score, saved work, source health, and daily brief.", status: "planned", icon: Home },
  { slug: "concierge", title: "AI city concierge", description: "Routes requests to source-grounded agents and refuses unsupported facts.", endpoint: "/api/v1/chat", status: "agent", icon: MessageSquareText },
  { slug: "travel-planner", title: "Travel planner", description: "Geocoding, OSRM road routes, weather context, and source metadata.", endpoint: "/api/v1/routes", status: "live-api", icon: Map },
  { slug: "relocation-planner", title: "Relocation planner", description: "Checklist, first day/week/month plans, and transparent constraints.", endpoint: "/api/v1/relocation-plan", status: "agent", icon: Compass },
  { slug: "pg-finder", title: "PG finder", description: "Verified owner-submitted PG listings only; no hotels or invented cards.", endpoint: "/api/v1/listings", status: "supabase", icon: Building2 },
  { slug: "hostel-finder", title: "Hostel finder", description: "Hostels from verified submissions and permitted outbound links.", status: "supabase", icon: Building2 },
  { slug: "flat-finder", title: "Flat finder", description: "Rooms and full flats with moderation, freshness, and report controls.", status: "supabase", icon: Home },
  { slug: "flat-sharing", title: "Flat-sharing finder", description: "Shared homes with privacy-preserving contact consent.", status: "supabase", icon: UsersRound },
  { slug: "flatmate-matching", title: "Flatmate matching", description: "Compatibility scoring from declared preferences and mutual consent.", status: "supabase", icon: UsersRound },
  { slug: "budget-planner", title: "Budget planner", description: "Affordable, balanced, and comfortable scenarios with formulas.", endpoint: "/api/v1/budget-plan", status: "calculated", icon: CircleDollarSign },
  { slug: "expense-tracker", title: "Expense tracker", description: "User-owned spending records, analytics, and overspend detection.", endpoint: "/api/v1/expenses", status: "supabase", icon: Activity },
  { slug: "area-comparison", title: "Area comparison", description: "Compare up to five areas without fake safety or rent scores.", endpoint: "/api/v1/area-comparison", status: "agent", icon: Landmark },
  { slug: "nearby-places", title: "Nearby places", description: "OpenStreetMap Overpass facilities with bounded searches.", endpoint: "/api/v1/nearby", status: "live-api", icon: Map },
  { slug: "tourist-explorer", title: "Tourist-place explorer", description: "OSM, Wikidata, Wikipedia, and official tourism sources.", endpoint: "/api/v1/tourist-itinerary", status: "agent", icon: Compass },
  { slug: "food-explorer", title: "Local-food explorer", description: "Permitted source results only; unsupported ratings stay hidden.", endpoint: "/api/v1/food-search", status: "agent", icon: BadgeCheck },
  { slug: "emergency", title: "Emergency assistance", description: "Hospitals, police, fire, and pharmacies only from emergency categories.", endpoint: "/api/v1/emergency-search", status: "live-api", icon: Hospital },
  { slug: "weather-air", title: "Weather and air quality", description: "Open-Meteo weather, UV, rain, wind, and air-quality timestamps.", endpoint: "/api/v1/weather", status: "live-api", icon: CloudSun },
  { slug: "safety-accessibility", title: "Safety and accessibility", description: "Official indicators and unknown accessibility labels where data is missing.", status: "planned", icon: ShieldCheck },
  { slug: "saved-plans", title: "Saved plans", description: "Per-user saved plans with sharing, votes, comments, and activity logs.", endpoint: "/api/v1/saved-plans", status: "supabase", icon: Bell },
  { slug: "notifications", title: "Notifications", description: "Freshness, collaborator, moderation, and daily brief notifications.", status: "supabase", icon: Bell },
  { slug: "profile", title: "User profile", description: "Budget, accessibility, safety, dietary, and relocation preferences.", status: "supabase", icon: UserRound },
  { slug: "owner", title: "Property-owner dashboard", description: "Submit, verify, refresh, and moderate accommodation listings.", status: "supabase", icon: Building2 },
  { slug: "admin", title: "Admin and moderation", description: "Review submissions, reports, source logs, and audit events.", status: "supabase", icon: ShieldCheck },
  { slug: "feedback", title: "Feedback and issue reporting", description: "Report stale, duplicate, unavailable, or incorrect information.", status: "supabase", icon: MessageSquareText },
  { slug: "transparency", title: "Data source transparency", description: "Provider registry, source freshness, API health, and cache status.", endpoint: "/api/v1/sources/status", status: "live-api", icon: BadgeCheck }
];

export function getFeature(slug: string) {
  return features.find((feature) => feature.slug === slug);
}
