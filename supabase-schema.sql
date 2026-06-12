create table if not exists public.kvw_app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kvw_app_state enable row level security;

drop policy if exists "KVW app state lezen" on public.kvw_app_state;
drop policy if exists "KVW app state maken" on public.kvw_app_state;
drop policy if exists "KVW app state bijwerken" on public.kvw_app_state;

create policy "KVW app state lezen"
  on public.kvw_app_state
  for select
  to anon
  using (id = 'main');

create policy "KVW app state maken"
  on public.kvw_app_state
  for insert
  to anon
  with check (id = 'main');

create policy "KVW app state bijwerken"
  on public.kvw_app_state
  for update
  to anon
  using (id = 'main')
  with check (id = 'main');
