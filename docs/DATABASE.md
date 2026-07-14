# Database Schema and RLS

The main migration is `supabase/migrations/202607140001_citymate_foundation.sql`.

It creates:

- User tables: `profiles`, `user_preferences`, `saved_plans`, `plan_items`, `expenses`, `expense_budgets`, `notifications`.
- Accommodation tables: `property_listings`, `property_photos`, `property_verifications`, `listing_reports`.
- Collaboration tables: `shared_plans`, `shared_plan_members`, `votes`, `comments`.
- Matching tables: `flatmate_profiles`, `flatmate_matches`.
- Source and cache tables: `source_registry`, `source_fetch_logs`, `geocoding_cache`, `places_cache`, `weather_cache`.
- RAG/agent tables: `rag_documents`, `rag_chunks`, `agent_runs`, `agent_tool_calls`.
- Reference data: `cities`, `areas`, `transport_sources`, `transport_stops`, `cost_records`.

Every user-owned table includes `user_id` and RLS policies that combine `TO authenticated` with `(select auth.uid()) = user_id`. Service-role keys must only be used server-side.
