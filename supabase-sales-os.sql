-- LINK CONTROL · Sales OS
-- Ejecutar en Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.prospects (
  id text primary key,
  owner_id uuid default auth.uid(),
  name text not null,
  city text,
  instagram text,
  website text,
  sales_channel text,
  industry text,
  ticket numeric default 0,
  audience numeric default 0,
  friction text,
  stage text default 'Descubierto',
  score integer default 0,
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clients (
  id text primary key,
  owner_id uuid default auth.uid(),
  name text not null,
  industry text,
  status text default 'activo',
  offer text,
  customer_profile text,
  channel text,
  objective text,
  next_action text,
  next_action_at timestamptz,
  value numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.opportunities (
  id text primary key,
  owner_id uuid default auth.uid(),
  prospect_id text,
  client_id text references public.clients(id) on delete set null,
  name text not null,
  stage text default 'Descubierto',
  product text,
  value numeric default 0,
  score integer default 0,
  next_action text,
  next_action_at timestamptz,
  completed_steps integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tasks (
  id text primary key,
  owner_id uuid default auth.uid(),
  title text not null,
  client_id text references public.clients(id) on delete cascade,
  prospect_id text references public.prospects(id) on delete cascade,
  status text default 'pendiente',
  priority text default 'media',
  due_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_sources (
  id text primary key,
  owner_id uuid default auth.uid(),
  client_id text references public.clients(id) on delete cascade,
  title text not null,
  kind text default 'note',
  source_url text,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_memories (
  id text primary key,
  owner_id uuid default auth.uid(),
  client_id text references public.clients(id) on delete cascade,
  title text,
  kind text default 'insight',
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.calendar_events (
  id text primary key,
  owner_id uuid default auth.uid(),
  client_id text references public.clients(id) on delete cascade,
  commitment_id text,
  step_index integer,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text default 'Programado',
  notes text,
  attendee text,
  google_event_id text,
  google_html_link text,
  created_on date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists prospects_owner_idx on public.prospects(owner_id);
create index if not exists prospects_stage_idx on public.prospects(stage);
create index if not exists prospects_score_idx on public.prospects(score desc);
create index if not exists opp_owner_idx on public.opportunities(owner_id);
create index if not exists tasks_due_idx on public.tasks(due_at);
create index if not exists sources_client_idx on public.client_sources(client_id);
create index if not exists memories_client_idx on public.client_memories(client_id);
create index if not exists events_start_idx on public.calendar_events(start_at);

alter table public.prospects enable row level security;
alter table public.clients enable row level security;
alter table public.opportunities enable row level security;
alter table public.tasks enable row level security;
alter table public.client_sources enable row level security;
alter table public.client_memories enable row level security;
alter table public.calendar_events enable row level security;

do $$ begin
  create policy prospects_owner_all on public.prospects for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy clients_owner_all on public.clients for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy opportunities_owner_all on public.opportunities for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy tasks_owner_all on public.tasks for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy sources_owner_all on public.client_sources for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy memories_owner_all on public.client_memories for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy calendar_owner_all on public.calendar_events for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;

-- Opcional para la siguiente iteración Notebook:
-- create extension if not exists vector;
-- alter table public.client_sources add column if not exists embedding vector(1536);
-- Luego agregar chunks + RPC de búsqueda semántica.
