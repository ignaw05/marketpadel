-- supabase/carga-explain.sql
--
-- EXPLAIN (ANALYZE, BUFFERS) de las 4 queries reales que emite la app
-- (lib/paletas-db.ts) contra la vista paletas_publicas. Correr despues de
-- sembrar los datos de carga-seed.sql:
--
--   psql "$SUPABASE_DB_URL" -f supabase/carga-explain.sql
--
-- Que mirar en cada plan:
--   - Seq Scan sobre paletas: la vista hace join con marcas y un exists()
--     contra promociones; si aparece un Seq Scan barriendo las 10.000 filas
--     en vez de usar paletas_feed_idx (estado_publicacion, created_at desc),
--     el indice no esta sirviendo al filtro ni al order by.
--   - SubPlan (o nested loop con promociones) ejecutado una vez por fila: es
--     el costo del exists() de "promocionada" dentro de la vista. Si el
--     numero de ejecuciones del subplan es igual a las filas de paletas
--     evaluadas (no solo a las 60 devueltas), la vista paga ese exists()
--     sobre filas que despues descarta.
--   - El tiempo del nodo Sort: si no hay un indice que resuelva
--     "promocionada desc, created_at desc" directo, el sort corre sobre el
--     resultado completo del filtro, no solo sobre 60 filas.

\echo 'H3 - feed sin filtros'
explain (analyze, buffers)
select id, vendedor_id, marca, modelo, forma, anio, estado, precio,
       provincia, ciudad, descripcion, fotos, visitas, promocionada
  from paletas_publicas
 order by promocionada desc, created_at desc
 limit 60;

\echo 'H5 - feed con filtros (marca + provincia + precio)'
explain (analyze, buffers)
select id, vendedor_id, marca, modelo, forma, anio, estado, precio,
       provincia, ciudad, descripcion, fotos, visitas, promocionada
  from paletas_publicas
 where marca = 'Nox' and provincia = 'CABA' and precio <= 400000
 order by promocionada desc, created_at desc
 limit 60;

\echo 'H4 - feed con busqueda (ilike)'
explain (analyze, buffers)
select id, vendedor_id, marca, modelo, forma, anio, estado, precio,
       provincia, ciudad, descripcion, fotos, visitas, promocionada
  from paletas_publicas
 where (modelo ilike '%nox%' or marca ilike '%nox%')
 order by promocionada desc, created_at desc
 limit 60;

\echo 'H2 - listarCiudades'
explain (analyze, buffers)
select ciudad
  from paletas_publicas
 limit 500;
