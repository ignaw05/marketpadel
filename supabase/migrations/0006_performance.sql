-- marketpadel: preparar el feed para volumen.
--
-- Con el catalogo actual (3 paletas activas) nada de esto se nota. Apunta a
-- lo que pasa cuando haya miles: hoy el feed no tiene un solo indice que
-- sirva a sus filtros, y ordena por una columna que la vista calcula con un
-- exists() correlacionado, o sea una subconsulta por fila.
--
-- DEPENDE DE 0005_vencimiento.sql: esa migracion agrego `vence_at` y le puso
-- a la vista el filtro `now() < p.vence_at`. Aca la vista se vuelve a crear,
-- asi que ese filtro se repite mas abajo. Si 0005 cambia, este archivo se
-- cambia con el, o las publicaciones vencidas vuelven al feed.
--
-- No cambia ninguna firma que use la app: la vista sigue exponiendo
-- `promocionada` como boolean con la misma semantica.

-- ------------------------------------------------- promocionada materializada
-- El problema: `paletas_publicas.promocionada` es
--   exists (select 1 from promociones pr where pr.paleta_id = p.id and now() < pr.hasta)
-- y el feed hace `order by promocionada desc`. Postgres tiene que evaluar ese
-- exists() para CADA paleta activa y recien despues ordenar y aplicar el
-- limit 60. Con 10.000 activas son 10.000 subconsultas por request.
--
-- La columna guarda el vencimiento de la promocion mas lejana. El exists()
-- desaparece: queda una comparacion contra una columna de la propia fila.

alter table paletas add column promocionada_hasta timestamptz;

comment on column paletas.promocionada_hasta is
  'Vencimiento de la promocion mas lejana de esta paleta. Lo mantiene el '
  'trigger promociones_tocar_paleta; no escribir a mano.';

create function promociones_tocar_paleta() returns trigger
language plpgsql as $$
begin
  -- Nota: esto dispara paletas_updated_at, asi que promocionar mueve el
  -- updated_at de la paleta. Es razonable (la publicacion cambio) y evita
  -- tener que excluir la columna del trigger existente.
  update paletas p
     set promocionada_hasta = (
       select max(hasta) from promociones where paleta_id = p.id
     )
   where p.id = coalesce(new.paleta_id, old.paleta_id);
  return null;
end $$;

-- after insert or update or delete: el update importa porque una promo puede
-- cambiar de fecha, y el delete porque tiene que volver a null.
create trigger promociones_tocar_paleta
  after insert or update or delete on promociones
  for each row execute function promociones_tocar_paleta();

-- Backfill de lo que ya existe.
update paletas p
   set promocionada_hasta = (
     select max(hasta) from promociones where paleta_id = p.id
   )
 where exists (select 1 from promociones where paleta_id = p.id);

-- ---------------------------------------------------------------- la vista
-- security_invoker = on NO ES OPCIONAL: sin eso la vista corre con los
-- permisos del dueno y saltea las policies de RLS de `paletas`.
--
-- El `now() < p.vence_at` viene de 0005_vencimiento.sql y tiene que quedarse:
-- sin el, las publicaciones vencidas reaparecen en el feed.

create or replace view paletas_publicas with (security_invoker = on) as
  select p.id, p.vendedor_id, p.marca_id, m.nombre as marca, p.modelo, p.forma,
         p.anio, p.estado, p.precio, p.provincia, p.ciudad, p.descripcion,
         p.fotos, p.visitas, p.created_at,
         -- coalesce obligatorio: promocionada_hasta es null en la mayoria de
         -- las filas, y `null > now()` da null, no false. Con `order by
         -- promocionada desc` Postgres pone los null PRIMERO, o sea que sin
         -- esto el feed mostraria las no promocionadas arriba de todo.
         coalesce(p.promocionada_hasta > now(), false) as promocionada
    from paletas p
    join marcas m on m.id = p.marca_id
   where p.estado_publicacion = 'activa'
     and now() < p.vence_at;

-- ---------------------------------------------------------------- indices
-- Todos parciales sobre estado_publicacion = 'activa': el feed nunca mira
-- otra cosa, y asi el indice ocupa solo lo publicado en vez de la tabla
-- entera (las vendidas y pausadas se acumulan para siempre).
--
-- vence_at no puede ir en el WHERE del indice parcial: `now()` no es
-- inmutable y Postgres no deja indexar sobre eso. Por eso va como columna
-- propia, que es lo que anticipaba el comentario ponytail de 0005.

drop index paletas_feed_idx;
create index paletas_activas_created_idx on paletas (created_at desc)
  where estado_publicacion = 'activa';
create index paletas_activas_vence_idx on paletas (vence_at)
  where estado_publicacion = 'activa';

create index paletas_activas_provincia_idx on paletas (provincia)
  where estado_publicacion = 'activa';
create index paletas_activas_ciudad_idx on paletas (ciudad)
  where estado_publicacion = 'activa';
create index paletas_activas_precio_idx on paletas (precio)
  where estado_publicacion = 'activa';
create index paletas_activas_marca_idx on paletas (marca_id)
  where estado_publicacion = 'activa';

-- ponytail: sin indice para `forma` (3 valores) ni `estado` (5). Con esa
-- cardinalidad el planner elige seq scan igual y el indice solo costaria
-- escrituras. Si algun dia el feed filtra casi siempre por forma, se agrega.

-- ---------------------------------------------------------------- busqueda
-- El feed busca con `modelo ilike '%q%' or marca ilike '%q%'`. El comodin
-- adelante hace que ningun btree sirva, y paletas_modelo_idx (gin sobre
-- to_tsvector) tampoco: tsvector matchea palabras completas, no infijos, y
-- ademas ilike no es el operador @@. O sea, ese indice nunca se uso.
-- pg_trgm sirve exactamente para este caso.

create extension if not exists pg_trgm with schema extensions;

-- pg_trgm puede terminar en `extensions` (default de Supabase) o en `public`
-- si alguien ya la instalo antes. Con las dos en el search_path, gin_trgm_ops
-- resuelve igual en cualquiera de los dos casos.
set local search_path = public, extensions;

drop index paletas_modelo_idx;
create index paletas_modelo_trgm_idx on paletas
  using gin (modelo gin_trgm_ops);
create index marcas_nombre_trgm_idx on marcas
  using gin (nombre gin_trgm_ops);

analyze paletas;
analyze marcas;
analyze promociones;

-- ---------------------------------------------------------------- checks
-- Misma convencion que el resto de las migraciones: si algo falla, la
-- transaccion se revierte entera y no queda nada aplicado.

do $checks$
declare
  u_a   uuid := gen_random_uuid();
  marca smallint;
  pal   uuid;
  venc  uuid;
  prom  uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-performance@example.com',
          '{"nombre":"Check","apellido":"Performance"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, marca, 'Perf Test AT10', 'Diamante', 2026, 9, 400000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  -- 1. sin promocion, la vista dice que no
  assert (select not promocionada from paletas_publicas where id = pal),
    'una paleta sin promocion no deberia figurar como promocionada';

  -- 2. promocionada es false, no null: `order by promocionada desc` pone los
  -- null primero y daria vuelta el feed entero.
  assert (select promocionada is not null from paletas_publicas where id = pal),
    'promocionada no puede ser null, tiene que ser false';

  -- 3. el trigger llena la columna al insertar la promocion
  insert into promociones (paleta_id, origen, hasta)
  values (pal, 'cortesia', now() + interval '30 days')
  returning id into prom;

  assert (select promocionada_hasta is not null from paletas where id = pal),
    'el trigger no materializo promocionada_hasta';
  assert (select promocionada from paletas_publicas where id = pal),
    'la vista no refleja la promocion vigente';

  -- 4. una promocion vencida no cuenta (mismo comportamiento que el exists viejo)
  update promociones set hasta = now() - interval '1 day' where id = prom;
  assert (select not promocionada from paletas_publicas where id = pal),
    'una promocion vencida no deberia contar como promocionada';

  -- 5. al borrar la promocion, la columna vuelve a null
  delete from promociones where id = prom;
  assert (select promocionada_hasta is null from paletas where id = pal),
    'el trigger no limpio promocionada_hasta al borrar la promocion';

  -- 6. la vista sigue resolviendo el nombre de la marca
  assert (select marca from paletas_publicas where id = pal) is not null,
    'la vista no resuelve el nombre de la marca';

  -- 7. no se perdio el filtro de vencimiento que trajo 0005_vencimiento.sql
  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion, vence_at)
  values (u_a, marca, 'vencida', 'Redonda', 2026, 8, 1000, 'CABA', 'CABA',
          'test', now() - interval '1 minute')
  returning id into venc;

  assert not exists (select 1 from paletas_publicas where id = venc),
    'una publicacion vencida no tendria que aparecer en el feed';

  delete from auth.users where id = u_a;
end $checks$;
