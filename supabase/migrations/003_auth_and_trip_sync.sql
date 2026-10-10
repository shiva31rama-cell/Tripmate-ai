-- Upgrade saved trips for cross-device itinerary persistence.
alter table public.trips
  add column if not exists days_count integer not null default 3,
  add column if not exists itinerary jsonb,
  add column if not exists context jsonb,
  add column if not exists note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trips_days_count_bounds'
      and conrelid = 'public.trips'::regclass
  ) then
    alter table public.trips
      add constraint trips_days_count_bounds check (days_count between 1 and 60);
  end if;
end $$;

create index if not exists trips_user_updated_at_idx
  on public.trips(user_id, updated_at desc);

-- Create a profile row automatically when Auth creates a new user.
create or replace function public.handle_new_tripmate_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_tripmate_auth_user_created on auth.users;
create trigger on_tripmate_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_tripmate_user();

-- The client can select/update only rows allowed by migration 002's owner RLS.
