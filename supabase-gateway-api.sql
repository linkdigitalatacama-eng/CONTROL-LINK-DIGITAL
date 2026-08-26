-- LINK GATEWAY · API keys + universal event protocol
-- La migración equivalente ya fue aplicada al proyecto Supabase CONTROL LINK DIGITAL.

create extension if not exists pgcrypto;

create table if not exists public.gateway_api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default array['events:write']::text[],
  status text not null default 'active' check (status in ('active','revoked')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists gateway_api_keys_owner_created_idx on public.gateway_api_keys(owner_id, created_at desc);
create index if not exists gateway_api_keys_hash_idx on public.gateway_api_keys(key_hash);

alter table public.gateway_api_keys enable row level security;

do $$ begin
  create policy gateway_api_keys_owner_select on public.gateway_api_keys for select to authenticated using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gateway_api_keys_owner_insert on public.gateway_api_keys for insert to authenticated with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gateway_api_keys_owner_update on public.gateway_api_keys for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

grant select, insert, update on public.gateway_api_keys to authenticated;

create or replace function public.gateway_revoke_api_key(p_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
begin
  update public.gateway_api_keys
     set status='revoked', revoked_at=coalesce(revoked_at, now())
   where id=p_id and owner_id=auth.uid() and status='active';
  return found;
end;
$$;
revoke all on function public.gateway_revoke_api_key(uuid) from public;
grant execute on function public.gateway_revoke_api_key(uuid) to authenticated;

-- El proyecto ya tenía gateway_events para Telegram/Web. Lo extendemos para API.
alter table public.gateway_events add column if not exists api_key_id uuid references public.gateway_api_keys(id) on delete set null;
alter table public.gateway_events add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.gateway_events add column if not exists event_id text;
alter table public.gateway_events add column if not exists source text not null default 'api';
alter table public.gateway_events add column if not exists external_id text;
alter table public.gateway_events add column if not exists idempotency_key text;
alter table public.gateway_events add column if not exists received_at timestamptz not null default now();

create unique index if not exists gateway_events_api_idempotency_idx on public.gateway_events(api_key_id, idempotency_key) where idempotency_key is not null;
create index if not exists gateway_events_api_owner_idx on public.gateway_events(owner_id, received_at desc);

alter table public.gateway_events enable row level security;
do $$ begin
  create policy gateway_events_owner_select on public.gateway_events for select to authenticated using (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

create or replace function public.gateway_auth_api_key(p_key text)
returns table (id uuid, owner_id uuid, scopes text[], status text)
language plpgsql security definer set search_path=public,extensions
as $$
declare v_hash text;
begin
  if p_key is null or length(trim(p_key)) < 20 then return; end if;
  v_hash := encode(digest(trim(p_key), 'sha256'), 'hex');
  return query update public.gateway_api_keys set last_used_at=now()
   where key_hash=v_hash and status='active'
   returning gateway_api_keys.id,gateway_api_keys.owner_id,gateway_api_keys.scopes,gateway_api_keys.status;
end;
$$;
revoke all on function public.gateway_auth_api_key(text) from public;
grant execute on function public.gateway_auth_api_key(text) to anon, authenticated;

create or replace function public.gateway_record_api_event(
  p_key text,
  p_event_type text,
  p_source text default 'api',
  p_external_id text default null,
  p_idempotency_key text default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$
declare v_auth record; v_row public.gateway_events;
begin
  select * into v_auth from public.gateway_auth_api_key(p_key);
  if v_auth.id is null then raise exception using errcode='28000', message='Invalid or revoked LINK API key'; end if;
  if not ('events:write'=any(v_auth.scopes)) then raise exception using errcode='42501', message='API key scope does not allow events:write'; end if;
  if p_idempotency_key is not null then
    select * into v_row from public.gateway_events where api_key_id=v_auth.id and idempotency_key=p_idempotency_key limit 1;
    if v_row.id is not null then return jsonb_build_object('ok',true,'duplicate',true,'event_id',v_row.id,'owner_id',v_auth.owner_id); end if;
  end if;
  insert into public.gateway_events(api_key_id,owner_id,event_id,event_type,source,external_id,idempotency_key,payload,received_at)
  values(v_auth.id,v_auth.owner_id,gen_random_uuid()::text,left(p_event_type,120),left(coalesce(p_source,'api'),80),left(p_external_id,240),left(p_idempotency_key,240),coalesce(p_payload,'{}'::jsonb),now())
  returning * into v_row;
  return jsonb_build_object('ok',true,'duplicate',false,'event_id',v_row.id,'owner_id',v_auth.owner_id);
end;
$$;
revoke all on function public.gateway_record_api_event(text,text,text,text,text,jsonb) from public;
grant execute on function public.gateway_record_api_event(text,text,text,text,text,jsonb) to anon, authenticated;
