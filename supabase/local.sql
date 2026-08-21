-- Lo que Supabase trae de fabrica y un Postgres pelado no, para poder correr
-- las migraciones de supabase/migrations contra una base local.
--
-- Existe porque a la base de produccion no se llega: la conexion directa es
-- solo IPv6 y no rutea, asi que sin esto una migracion se aplica a mano en el
-- editor de Supabase sin haberla probado nunca.
--
-- Como se usa (Postgres local, sin Docker):
--
--   export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"
--   S=/tmp/pgpaletita                      # corto a proposito: el socket de
--   initdb -D $S/data -U postgres --auth=trust   # unix corta en 103 bytes
--   pg_ctl -D $S/data -o "-p 55432 -k $S -c listen_addresses=" -l $S/log start
--   psql -h $S -p 55432 -U postgres -c "create database paletita"
--   psql -h $S -p 55432 -U postgres -d paletita -f supabase/local.sql
--   for m in supabase/migrations/*.sql; do
--     psql -h $S -p 55432 -U postgres -v ON_ERROR_STOP=1 -1 -d paletita -f $m
--   done
--
-- El -1 no es opcional: cada migracion termina en un bloque `do $checks$` con
-- asserts que tienen que poder revertir la transaccion entera.
--
-- Para reproducir PRODUCCION y no el repo, saltear 0006 y 0014, que al
-- 21/08/2026 no estan aplicadas alla.

-- Los tres roles de Supabase. Son del cluster, no de la base: si ya existen de
-- una corrida anterior, no se recrean.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

-- Supabase le da acceso amplio a los tres y deja que RLS sea la unica barrera.
-- Sin esto, los checks de las migraciones que hacen `set role anon` fallan por
-- permisos en vez de por la policy, que es lo que quieren probar.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ------------------------------------------------------------------- auth
-- Solo las columnas que las migraciones tocan de verdad.
create schema auth;

create table auth.users (
  id                 uuid primary key,
  instance_id        uuid,
  aud                text,
  role               text,
  email              text,
  encrypted_password text,
  raw_app_meta_data  jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  banned_until       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;

-- ---------------------------------------------------------------- storage
-- 0001 crea el bucket de fotos y sus policies.
create schema storage;

create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  owner      uuid,
  created_at timestamptz default now(),
  metadata   jsonb
);
alter table storage.objects enable row level security;

create function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/') $$;
