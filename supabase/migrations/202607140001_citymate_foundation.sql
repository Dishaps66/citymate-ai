create extension if not exists vector;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'traveller' check (role in ('traveller', 'owner', 'admin')),
  city text,
  phone text,
  accessibility_needs text[] not null default '{}',
  safety_preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_monthly numeric,
  workplace text,
  college text,
  dietary_preferences text[] not null default '{}',
  preferred_languages text[] not null default array['en'],
  evidence_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  country text not null default 'India',
  source_url text,
  retrieved_at timestamptz,
  verification_status text not null default 'historical_or_reference',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, state, country)
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  source_url text,
  retrieved_at timestamptz,
  verification_status text not null default 'source_returned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.geocoding_cache (
  id uuid primary key default gen_random_uuid(),
  query text not null unique,
  response jsonb not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  freshness text not null default 'recent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_m integer not null,
  response jsonb not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  freshness text not null default 'recent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weather_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  response jsonb not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  freshness text not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_sources (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  source_url text not null,
  feed_type text not null,
  status text not null default 'needs_verification',
  retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_stops (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.transport_sources(id) on delete cascade,
  external_id text,
  name text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cost_records (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  category text not null,
  low_value numeric,
  high_value numeric,
  currency text not null default 'INR',
  source_url text,
  effective_date date,
  confidence text not null default 'unverified',
  retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  listing_type text not null check (listing_type in ('pg', 'hostel', 'room', 'shared_flat', 'full_flat')),
  city text not null,
  locality text,
  address text,
  latitude double precision,
  longitude double precision,
  rent_monthly numeric not null,
  deposit numeric,
  amenities text[] not null default '{}',
  verification_status text not null default 'verification_pending',
  moderation_status text not null default 'pending',
  last_confirmed_available_at timestamptz,
  expires_at timestamptz,
  source_url text,
  retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  storage_path text not null,
  checksum text,
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  method text not null,
  status text not null default 'pending',
  verified_at timestamptz,
  evidence_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.property_listings(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flatmate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  city text not null,
  budget_min numeric,
  budget_max numeric,
  locality_preferences text[] not null default '{}',
  gender_preference text,
  lifestyle jsonb not null default '{}',
  move_in_date date,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flatmate_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  matched_user_id uuid not null references auth.users(id) on delete cascade,
  compatibility_score numeric not null,
  reasons jsonb not null default '[]',
  consent_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  city text,
  plan_type text not null default 'relocation',
  content jsonb not null default '{}',
  source_url text,
  retrieved_at timestamptz,
  verification_status text not null default 'user_saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.saved_plans(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null check (amount > 0),
  spent_on date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

create table if not exists public.shared_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.saved_plans(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_plan_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_plan_id uuid not null references public.shared_plans(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_plan_id uuid not null references public.shared_plans(id) on delete cascade,
  subject_type text not null,
  subject_id uuid,
  value integer not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_plan_id uuid not null references public.shared_plans(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider_type text not null,
  base_url text not null,
  licence text,
  status text not null default 'configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_fetch_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.source_registry(id) on delete set null,
  request_id uuid,
  status text not null,
  latency_ms integer,
  error_message text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  authority text,
  source_url text not null,
  publication_date date,
  update_date date,
  city text,
  category text,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid not null,
  selected_agents text[] not null default '{}',
  status text not null,
  provider_failures jsonb not null default '[]',
  sources jsonb not null default '[]',
  execution_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  tool_name text not null,
  status text not null,
  source_url text,
  retrieved_at timestamptz,
  input_summary jsonb not null default '{}',
  output_summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  message text not null,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_areas_city on public.areas(city_id);
create index if not exists idx_places_cache_category_coords on public.places_cache(category, latitude, longitude);
create index if not exists idx_property_listings_user_city on public.property_listings(user_id, city);
create index if not exists idx_property_listings_coords on public.property_listings(latitude, longitude);
create index if not exists idx_saved_plans_user on public.saved_plans(user_id, created_at desc);
create index if not exists idx_expenses_user_date on public.expenses(user_id, spent_on desc);
create index if not exists idx_rag_chunks_embedding on public.rag_chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists idx_agent_runs_user on public.agent_runs(user_id, created_at desc);
create index if not exists idx_source_fetch_logs_source on public.source_fetch_logs(source_id, retrieved_at desc);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles','user_preferences','cities','areas','geocoding_cache','places_cache','weather_cache',
    'transport_sources','transport_stops','cost_records','property_listings','property_photos',
    'property_verifications','listing_reports','flatmate_profiles','flatmate_matches','saved_plans',
    'plan_items','expenses','expense_budgets','shared_plans','shared_plan_members','votes','comments',
    'notifications','source_registry','source_fetch_logs','rag_documents','rag_chunks','agent_runs',
    'agent_tool_calls','feedback','audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = target_table and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists set_%I_updated_at on public.%I', target_table, target_table);
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
  end loop;
end $$;

create policy "profiles own select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles own insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "preferences own all" on public.user_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "listings owner all" on public.property_listings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "listing photos owner all" on public.property_photos for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "listing verifications owner all" on public.property_verifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "listing reports owner all" on public.listing_reports for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "flatmate profiles owner all" on public.flatmate_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "flatmate matches owner select" on public.flatmate_matches for select to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = matched_user_id);
create policy "flatmate matches owner insert" on public.flatmate_matches for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved plans owner all" on public.saved_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "plan items owner all" on public.plan_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "expenses owner all" on public.expenses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "expense budgets owner all" on public.expense_budgets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "shared plans owner all" on public.shared_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "shared members own all" on public.shared_plan_members for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "votes owner all" on public.votes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "comments owner all" on public.comments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notifications owner all" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rag documents public source read" on public.rag_documents for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "rag documents owner write" on public.rag_documents for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rag chunks public source read" on public.rag_chunks for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "rag chunks owner write" on public.rag_chunks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agent runs owner select" on public.agent_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy "agent tool calls via own run" on public.agent_tool_calls for select to authenticated using (
  exists (select 1 from public.agent_runs run where run.id = agent_run_id and run.user_id = (select auth.uid()))
);
create policy "feedback owner insert" on public.feedback for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "feedback owner select" on public.feedback for select to authenticated using ((select auth.uid()) = user_id);

create policy "reference cities readable" on public.cities for select to authenticated using (true);
create policy "reference areas readable" on public.areas for select to authenticated using (true);
create policy "reference geocode cache readable" on public.geocoding_cache for select to authenticated using (true);
create policy "reference places cache readable" on public.places_cache for select to authenticated using (true);
create policy "reference weather cache readable" on public.weather_cache for select to authenticated using (true);
create policy "reference transport sources readable" on public.transport_sources for select to authenticated using (true);
create policy "reference transport stops readable" on public.transport_stops for select to authenticated using (true);
create policy "reference cost records readable" on public.cost_records for select to authenticated using (true);
create policy "source registry readable" on public.source_registry for select to authenticated using (true);
create policy "source fetch logs readable" on public.source_fetch_logs for select to authenticated using (true);
