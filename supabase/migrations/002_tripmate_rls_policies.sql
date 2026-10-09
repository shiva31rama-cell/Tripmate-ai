-- Add owner-scoped policies as a separate migration so existing deployments can safely upgrade.
-- All nested records are authorized through their owning trip.
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_preferences enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;
alter table public.saved_places enable row level security;
alter table public.budget_items enable row level security;
alter table public.data_sources enable row level security;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists trips_owner_all on public.trips;
create policy trips_owner_all on public.trips
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists trip_preferences_owner_all on public.trip_preferences;
create policy trip_preferences_owner_all on public.trip_preferences
for all using (exists (select 1 from public.trips t where t.id = trip_preferences.trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = trip_preferences.trip_id and t.user_id = auth.uid()));

drop policy if exists trip_days_owner_all on public.trip_days;
create policy trip_days_owner_all on public.trip_days
for all using (exists (select 1 from public.trips t where t.id = trip_days.trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = trip_days.trip_id and t.user_id = auth.uid()));

drop policy if exists trip_items_owner_all on public.trip_items;
create policy trip_items_owner_all on public.trip_items
for all using (
  exists (
    select 1 from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = trip_items.trip_day_id and t.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = trip_items.trip_day_id and t.user_id = auth.uid()
  )
);

drop policy if exists saved_places_owner_all on public.saved_places;
create policy saved_places_owner_all on public.saved_places
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists budget_items_owner_all on public.budget_items;
create policy budget_items_owner_all on public.budget_items
for all using (exists (select 1 from public.trips t where t.id = budget_items.trip_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.trips t where t.id = budget_items.trip_id and t.user_id = auth.uid()));

drop policy if exists data_sources_read on public.data_sources;
create policy data_sources_read on public.data_sources
for select using (true);
