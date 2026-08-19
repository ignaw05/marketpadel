-- Dos cosas que entran juntas porque las pide la misma pantalla:
--   1. `sponsors`, la tira que se mueve abajo del header y es lo ultimo que
--      queda fijo al scrollear.
--   2. `acepta_permuta`, un filtro mas del feed.

-- ---------------------------------------------------------------- sponsors

create table sponsors (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(nombre) between 1 and 80),
  logo_url   text not null,
  -- Opcional: un sponsor puede pagar la tira sin querer mandar trafico afuera.
  link       text,
  orden      int  not null default 0,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- El unico acceso que existe es "los activos, en orden": un indice parcial que
-- cubre justo eso. created_at desempata para que dos sponsors con el mismo
-- orden no se intercambien de lugar entre requests.
create index sponsors_visibles_idx on sponsors (orden, created_at) where activo;

alter table sponsors enable row level security;

-- Solo lectura, y solo de los activos: la tira la ve cualquiera, logueado o no.
--
-- No hay policy de insert/update/delete A PROPOSITO. El ABM del panel corre con
-- service role (lib/supabase/admin.ts), que bypasea RLS; sin policies de
-- escritura, ningun navegador puede tocar la tabla ni con sesion valida.
create policy sponsors_lectura on sponsors
  for select using (activo);

-- Bucket propio para los logos. Publico como el de paletas: son imagenes que se
-- muestran en la home a visitantes anonimos.
insert into storage.buckets (id, name, public)
  values ('sponsors', 'sponsors', true)
  on conflict (id) do nothing;

create policy sponsors_logo_lectura on storage.objects
  for select using (bucket_id = 'sponsors');

-- Sin policy de alta ni de baja: subir y borrar logos pasa por el panel, que va
-- con service role. Que un usuario logueado no pueda escribir en este bucket es
-- la mitad del punto de tenerlo separado de 'paletas'.

-- ---------------------------------------------------------------- permuta

alter table paletas add column acepta_permuta boolean not null default false;

-- Sin indice: es un booleano con dos valores sobre una tabla chica, y el filtro
-- nunca va solo (siempre acompana al resto del feed, que ya usa
-- paletas_activas_created_idx). ponytail: si algun dia el catalogo crece y el
-- EXPLAIN lo pide, entra un parcial `where estado_publicacion = 'activa'`.

-- La vista tiene que reexponerla: el feed filtra contra paletas_publicas, no
-- contra paletas.
--
-- Dos cosas mandan sobre como se escribe esto:
--
-- 1. `create or replace view` solo admite AGREGAR columnas AL FINAL. Por eso
--    acepta_permuta va ultima y no al lado de las otras columnas de la paleta.
--
-- 2. La expresion de `promocionada` depende de si 0006_performance.sql esta
--    aplicada. 0005 la calcula con un exists() correlacionado; 0006 la
--    materializa en paletas.promocionada_hasta. Reescribir la vista con una
--    version fija romperia el entorno que este en la otra: en produccion, hoy,
--    0006 NO esta aplicada, y en una base nueva `supabase db push` la aplica.
--    Asi que se detecta y se conserva la que corresponda. Esta migracion no
--    opina sobre cual de las dos es mejor, solo no la pisa.
do $vista$
declare
  materializada boolean := exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'paletas'
       and column_name = 'promocionada_hasta'
  );
  promocionada text := case
    when materializada then 'coalesce(p.promocionada_hasta > now(), false)'
    else 'exists (select 1 from promociones pr
                   where pr.paleta_id = p.id and now() < pr.hasta)'
  end;
begin
  -- security_invoker = on NO ES OPCIONAL: sin eso la vista corre con los
  -- permisos del dueno y saltea las policies de RLS de `paletas`.
  execute format($sql$
    create or replace view paletas_publicas with (security_invoker = on) as
      select p.id, p.vendedor_id, p.marca_id, m.nombre as marca, p.modelo,
             p.forma, p.anio, p.estado, p.precio, p.provincia, p.ciudad,
             p.descripcion, p.fotos, p.visitas, p.created_at,
             %s as promocionada,
             p.acepta_permuta
        from paletas p
        join marcas m on m.id = p.marca_id
       where p.estado_publicacion = 'activa'
         and now() < p.vence_at
  $sql$, promocionada);
end $vista$;

-- ---------------------------------------------------------------- checks

do $checks$
declare
  u_a   uuid := gen_random_uuid();
  marca smallint;
  pal   uuid;
begin
  -- 1. sponsors: el orden es el que promete el indice, y `activo` filtra
  insert into sponsors (nombre, logo_url, orden, activo)
  values ('Check Sponsor B', 'https://example.test/b.webp', 2, true),
         ('Check Sponsor A', 'https://example.test/a.webp', 1, true),
         ('Check Sponsor Z', 'https://example.test/z.webp', 0, false);

  assert (select array_agg(nombre order by orden, created_at)
            from sponsors where activo and nombre like 'Check Sponsor%')
         = array['Check Sponsor A', 'Check Sponsor B'],
    'la tira tendria que traer solo los activos y en orden';

  -- 2. lo que no puede pasar: que alguien escriba sponsors desde el navegador
  assert not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'sponsors' and cmd <> 'SELECT'
  ), 'sponsors no puede tener policies de escritura: el ABM va con service role';

  assert (select relrowsecurity from pg_class where oid = 'public.sponsors'::regclass),
    'sponsors tiene que tener RLS habilitado';

  -- 3. permuta: default false y la vista la expone
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-permuta@example.com',
          '{"nombre":"Check","apellido":"Permuta"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, marca, 'Check Permuta', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  assert not (select acepta_permuta from paletas where id = pal),
    'acepta_permuta tendria que arrancar en false';
  assert not (select acepta_permuta from paletas_publicas where id = pal),
    'la vista publica tendria que exponer acepta_permuta';

  update paletas set acepta_permuta = true where id = pal;
  assert (select acepta_permuta from paletas_publicas where id = pal),
    'la vista no refleja el cambio de acepta_permuta';

  -- teardown
  delete from sponsors where nombre like 'Check Sponsor%';
  delete from auth.users where id = u_a;
end $checks$;
