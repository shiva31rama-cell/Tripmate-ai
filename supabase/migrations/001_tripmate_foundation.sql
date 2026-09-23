-- TripMate AI foundation schema
-- Apply this migration in Supabase when you create the project.
-- RLS policies should be enabled before production data is written.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en',
  preferred_currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_name text not null,
  destination_name text not null,
  source_place_id text,
  destination_place_id text,
  departure_date date,
  return_date date,
  travellers integer not null default 1 check (travellers between 1 and 30),
  budget_total numeric(12,2),
  budget_per_person numeric(12,2),
  currency text not null default 'INR',
  status text not null default 'DRAFT',
  data_status text not null default 'DEMO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_preferences (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  travel_modes text[] not null default '{}',
  interests text[] not null default '{}',
  food_preferences text[] not null default '{}',
  accommodation_preference text,
  travel_pace text,
  student_mode boolean not null default false,
  family_mode boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null,
  trip_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  item_type text not null,
  title text not null,
  place_id text,
  start_time time,
  end_time time,
  duration_minutes integer,
  estimated_cost numeric(12,2),
  currency text default 'INR',
  data_status text not null default 'DEMO',
  provider text,
  source_url text,
  checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  url text,
  license text,
  authority_level text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  provider_place_id text,
  name text not null,
  category text,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  amount numeric(12,2),
  currency text not null default 'INR',
  basis text,
  data_status text not null default 'DEMO',
  provider text,
  source_url text,
  checked_at timestamptz,
  calculation_basis text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_preferences enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;
alter table public.saved_places enable row level security;
alter table public.budget_items enable row level security;


-- Public source catalog: readable by clients, not user-owned.
alter table public.data_sources enable row level security;
drop policy if exists "data_sources_read" on public.data_sources;
create policy "data_sources_read" on public.data_sources
for select using (true);

-- Keep source metadata reusable without exposing user-owned records.
create index if not exists data_sources_authority_level_idx
  on public.data_sources(authority_level);
create index if not exists data_sources_source_type_idx
  on public.data_sources(source_type);
