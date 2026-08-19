-- marketpadel: historial de ventas global, visible para cualquiera desde el feed.
--
-- paletas_publicas no sirve: filtra por estado_publicacion = 'activa' y ademas
-- corre con security_invoker = on, o sea que hereda la RLS de paletas_lectura
-- ("activa o vendedor_id = auth.uid()"). Una vendida ajena no pasa ese filtro.
--
-- La alternativa obvia -- ampliar paletas_lectura para dejar pasar tambien
-- 'vendida' -- se descarta a proposito: RLS es por fila, no por columna, asi
-- que cualquier logueado podria pedir vendedor_id, descripcion, ciudad de una
-- vendida ajena directo contra la tabla paletas y, cruzando con perfiles (que
-- ya es 100% publica), sacar nombre y whatsapp del vendedor. Justo lo que el
-- historial global tiene que evitar: es anonimo a proposito.
--
-- Por eso esta vista NO lleva security_invoker = on. Sin esa clausula corre
-- con los permisos de quien la crea (misma logica que incrementar_visitas()
-- en 0001), asi que se salta la RLS de paletas por diseño -- pero el unico
-- lugar donde eso importa es el SELECT de aca abajo, y esa lista de columnas
-- es la barrera real: ni vendedor_id ni descripcion ni ciudad/provincia
-- salen nunca, entonces no hay con que cruzar a perfiles.
create view ventas_publicas as
  select p.id, m.nombre as marca, p.modelo, p.estado, p.precio, p.fotos,
         p.updated_at as vendida_at
    from paletas p
    join marcas m on m.id = p.marca_id
   where p.estado_publicacion = 'vendida';

-- ---------------------------------------------------------------- checks

do $checks$
declare
  u_b uuid := gen_random_uuid();
  p_vendida uuid;
  p_activa  uuid;
  marca_id smallint;
  n int;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_b, 'check-ventas-b@example.com', '{"nombre":"Beto","apellido":"Test"}'::jsonb);

  select id into marca_id from marcas where nombre = 'Nox';

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion, estado_publicacion)
  values (u_b, marca_id, 'Check Vendida', 'Diamante', 2026, 9, 250000,
          'CABA', 'CABA', 'test', 'vendida')
  returning id into p_vendida;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion, estado_publicacion)
  values (u_b, marca_id, 'Check Activa', 'Diamante', 2026, 9, 250000,
          'CABA', 'CABA', 'test', 'activa')
  returning id into p_activa;

  -- 1. la vendida ajena aparece en el historial global, resuelta con marca y todo
  assert (select marca from ventas_publicas where id = p_vendida) = 'Nox',
    'la vendida ajena tendria que aparecer en ventas_publicas';

  -- 2. lo que sigue activo no es "vendido"
  assert (select count(*) from ventas_publicas where id = p_activa) = 0,
    'una publicacion activa no tendria que aparecer en el historial de ventas';

  -- 3. la vista nunca expone columnas que identifiquen al vendedor
  select count(*) into n
    from information_schema.columns
   where table_name = 'ventas_publicas'
     and column_name in ('vendedor_id', 'descripcion', 'provincia', 'ciudad');
  assert n = 0, 'ventas_publicas no puede exponer columnas que identifiquen al vendedor';

  -- 4. la RLS de paletas sigue tan cerrada como antes: un logueado sin ser el
  -- dueno no puede leer la vendida ajena pidiendola directo a la tabla base.
  set local role authenticated;
  select count(*) into n from paletas where id = p_vendida;
  reset role;
  assert n = 0, 'paletas_lectura no tendria que haberse tocado';

  delete from auth.users where id = u_b;
end $checks$;
