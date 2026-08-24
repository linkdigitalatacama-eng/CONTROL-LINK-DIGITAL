-- LINK CONTROL · Sales OS + Notebook Intelligence
-- Ejecutar completo en Supabase SQL Editor.
create extension if not exists pgcrypto;
create extension if not exists vector;

-- IDs para inserciones server-side/MCP sin romper el esquema v1.
alter table public.prospects alter column id set default gen_random_uuid()::text;
alter table public.clients alter column id set default gen_random_uuid()::text;
alter table public.opportunities alter column id set default gen_random_uuid()::text;
alter table public.tasks alter column id set default gen_random_uuid()::text;
alter table public.client_sources alter column id set default gen_random_uuid()::text;
alter table public.client_memories alter column id set default gen_random_uuid()::text;
alter table public.calendar_events alter column id set default gen_random_uuid()::text;

create unique index if not exists prospects_name_city_unique on public.prospects(lower(name),lower(coalesce(city,'')));

create table if not exists public.previews (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid default auth.uid(),
  prospect_id text references public.prospects(id) on delete set null,
  client_id text references public.clients(id) on delete set null,
  name text not null,
  status text default 'conceptual',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_documents (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid default auth.uid(),
  client_id text not null references public.clients(id) on delete cascade,
  title text not null,
  kind text default 'document',
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  content_preview text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_document_chunks (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid default auth.uid(),
  document_id text not null references public.client_documents(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  token_count integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists previews_prospect_idx on public.previews(prospect_id);
create index if not exists documents_client_idx on public.client_documents(client_id);
create index if not exists chunks_client_idx on public.client_document_chunks(client_id);
create index if not exists chunks_embedding_hnsw on public.client_document_chunks using hnsw (embedding vector_cosine_ops);

alter table public.previews enable row level security;
alter table public.client_documents enable row level security;
alter table public.client_document_chunks enable row level security;

do $$ begin
  create policy previews_owner_all on public.previews for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy documents_owner_all on public.client_documents for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chunks_owner_all on public.client_document_chunks for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
exception when duplicate_object then null; end $$;

create or replace function public.match_client_document_chunks(
  query_embedding vector(1536),
  match_client_id text,
  match_threshold float default 0.62,
  match_count int default 8
)
returns table (
  id text,
  document_id text,
  client_id text,
  chunk_index int,
  content text,
  similarity float,
  title text,
  source_url text,
  metadata jsonb
)
language sql stable
as $$
  select c.id,c.document_id,c.client_id,c.chunk_index,c.content,
         1-(c.embedding <=> query_embedding) as similarity,
         d.title,d.source_url,c.metadata
  from public.client_document_chunks c
  join public.client_documents d on d.id=c.document_id
  where c.client_id=match_client_id
    and c.embedding is not null
    and 1-(c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit least(match_count,50);
$$;

-- Índices operativos para el Hunter/Pipeline.
create index if not exists prospects_city_idx on public.prospects(city);
create index if not exists prospects_website_idx on public.prospects(website);
create index if not exists prospects_next_action_idx on public.prospects(next_action_at);

-- Nota: configura LINK_OWNER_ID en Vercel con el UUID del usuario de LINK DIGITAL
-- si quieres que las inserciones server-side aparezcan directamente bajo RLS del usuario.
