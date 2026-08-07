-- supabase/carga-seed.sql
--
-- Datos sinteticos para un test de carga contra el proyecto Supabase REAL.
-- Corre con psql, nunca con la CLI de supabase (esto no es una migracion).
--
--   psql "$SUPABASE_DB_URL" -v modo=sembrar -f supabase/carga-seed.sql
--   psql "$SUPABASE_DB_URL" -v modo=borrar  -f supabase/carga-seed.sql
--
-- Requiere conectarse con un rol dueno de las tablas (el connection string
-- admin de Supabase, no el anon/authenticated de la app): inserta directo en
-- auth.users y en paletas sin pasar por RLS.
--
-- Todo cuelga de un unico perfil semilla con uuid fijo, para poder borrar
-- todo con un solo delete en cascada.

\set ON_ERROR_STOP on

\if :{?modo}
\else
  \echo 'ERROR: falta la variable modo. Uso: -v modo=sembrar  o  -v modo=borrar'
  \quit 1
\endif

-- psql no soporta comparar strings directo en \if (el argumento tiene que
-- ser ya un literal booleano), asi que la comparacion se hace en SQL y el
-- resultado ('t'/'f') se trae con \gset.
select :'modo' = 'sembrar' as es_sembrar \gset
select :'modo' = 'borrar'  as es_borrar  \gset

\if :es_sembrar

begin;

-- ---------------------------------------------------------------- perfil semilla
-- El trigger perfil_al_registrarse (0001_init.sql) crea la fila en perfiles solo.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-00000000ca11',
  'authenticated', 'authenticated', 'carga@test.local', '',
  now(), now(), '{}', '{"nombre":"Carga","apellido":"Test"}'
);

-- ---------------------------------------------------------------- paletas
-- 10.000 filas en un solo insert ... select. marca_id rota sobre el
-- catalogo real (marcas_orden), no sobre ids hardcodeados: si la base real
-- tiene otra cantidad de marcas, esto se adapta solo.

with marcas_orden as (
  select id, row_number() over (order by id) - 1 as rn, count(*) over () as n
  from marcas
)
insert into paletas (
  vendedor_id, marca_id, modelo, forma, anio, estado, precio,
  provincia, ciudad, descripcion, fotos, estado_publicacion, created_at
)
select
  '00000000-0000-0000-0000-00000000ca11'::uuid,
  mo.id,
  (array['Nox AT10', 'Bullpadel Vertex', 'Adidas Metalbone', 'Babolat Technical Viper',
         'Head Extreme', 'Siux Electra', 'StarVie Metheora', 'Varlion Lethal Zone',
         'Vibor-A King', 'Wilson Bela'])[(i % 10) + 1] || ' ' || i::text,
  (array['Diamante', 'Lágrima', 'Redonda'])[(i % 3) + 1],
  2019 + (i % 8),
  6 + (i % 5),
  30000 + (i % 771) * 1000,
  (array['CABA', 'Buenos Aires', 'Buenos Aires', 'Córdoba',
         'Santa Fe', 'Mendoza', 'Tucumán', 'Neuquén'])[(i % 8) + 1],
  (array['CABA', 'La Plata', 'Mar del Plata', 'Córdoba',
         'Rosario', 'Mendoza', 'San Miguel de Tucumán', 'Neuquén'])[(i % 8) + 1],
  'Paleta en buen estado, poco uso. Ideal para jugar los fines de semana en el club.',
  -- Una sola foto por paleta, rotando entre EXACTAMENTE 3 urls que ya
  -- existen en public/paletas/. No usar una url por fila: cada url distinta
  -- consume una transformacion del optimizador de imagenes de Vercel, y el
  -- free tier da ~5000/mes. Con 3 urls compartidas entre 10.000 filas el
  -- consumo es despreciable (3 transformaciones, no 10.000).
  array['/paletas/' || (array[
    'p0-babolat-air-veron-2023.webp',
    'p1-adidas-metalbone-pro-edt-2026.webp',
    'p2-adidas-metalbone-reserve-edt-2026.webp'
  ])[(i % 3) + 1]],
  'activa',
  now() - ((i % 180) || ' days')::interval
from generate_series(1, 10000) as i
join marcas_orden mo on mo.rn = i % mo.n;

-- ---------------------------------------------------------------- promociones
-- 5% de las paletas (500 de 10.000), origen 'cortesia': el trigger
-- promociones_validar solo valida creditos cuando origen = 'premium', asi
-- que esto entra sin suscripcion ni pago (ver 0002_promocion_cortesia.sql).

insert into promociones (paleta_id, origen, hasta)
select id, 'cortesia', now() + interval '30 days'
from (
  select id, row_number() over (order by id) as rn
  from paletas
  where vendedor_id = '00000000-0000-0000-0000-00000000ca11'
) t
where t.rn % 20 = 0;

-- Sin esto el planner usa estadisticas viejas (o ninguna) y los EXPLAIN de
-- carga-explain.sql mienten sobre los planes que elegiria en produccion.
analyze paletas;
analyze promociones;

commit;

select count(*) as total_paletas
  from paletas
 where vendedor_id = '00000000-0000-0000-0000-00000000ca11';

\elif :es_borrar

-- La cascada (paletas.vendedor_id -> perfiles, promociones.paleta_id ->
-- paletas, ambas on delete cascade) se lleva perfil, paletas y promociones
-- solas.
begin;
delete from auth.users where id = '00000000-0000-0000-0000-00000000ca11';
commit;

\else
  \echo 'ERROR: modo invalido. Uso: -v modo=sembrar  o  -v modo=borrar'
  \quit 1
\endif
