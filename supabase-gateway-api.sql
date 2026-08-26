-- LINK GATEWAY · API keys + universal event protocol
-- Ejecutar una vez en Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.gateway_api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default array['events:write']::text[],
  status text not null default 'active' check (status in ('active','revoked')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists gateway_api_keys_owner_idx on public.gateway_api_keys(owner_id);
create index if not exists gateway_api_keys_prefix_idx on public.gateway_api_keys(key_prefix);

alter table public.gateway_api_keys enable row level security;

do $$ begin
  create policy gateway_api_keys_owner_select on public.gateway_api_keys
    for select to authenticated using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy gateway_api_keys_owner_insert on public.gateway_api_keys
    for insert to authenticated with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy gateway_api_keys_owner_update on public.gateway_api_keys
    for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Solo devuelve metadatos mínimos. Nunca expone el hash ni la clave original.
create or replace function public.gateway_auth_api_key(p_key text)
returns table (id uuid, owner_id uuid, scopes text[], status text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if p_key is null or length(trim(p_key)) < 20 then return; end if;
  v_hash := encode(digest(trim(p_key), 'sha256'), 'hex');
  return query
    update public.gateway_api_keys
       set last_used_at = now()
     where key_hash = v_hash
       and status = 'active'
     returning gateway_api_keys.id, gateway_api_keys.owner_id, gateway_api_keys.scopes, gateway_api_keys.status;
end;
$$;

grant execute on function public.gateway_auth_api_key(text) to anon, authenticated;

create or replace function public.gateway_revoke_api_key(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gateway_api_keys
     set status='revoked', revoked_at=now()
   where id=p_id and owner_id=auth.uid() and status='active';
  return found;
end;
$$;

grant execute on function public.gateway_revoke_api_key(uuid) to authenticated;
