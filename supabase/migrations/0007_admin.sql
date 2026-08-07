-- marketpadel: lo que necesita el panel de superadmin.
--
-- El panel corre entero con service role (lib/supabase/admin.ts), que ya
-- bypasea RLS, asi que moderar publicaciones y usuarios no necesita nada nuevo
-- en la base: son updates comunes sobre `paletas` y el Admin API de auth.
--
-- Lo que si falta son dos lecturas que PostgREST no puede resolver solo:
--   1. `auth.users` no esta en los esquemas expuestos, y el panel necesita el
--      email y el estado de baneo de cada perfil.
--   2. El resumen agrupa por mes, y PostgREST no hace group by.
--
-- Los dos objetos quedan reservados a service_role. Ninguno se llama desde el
-- navegador.

-- ------------------------------------------------------------- admin_usuarios
-- SIN security_invoker a proposito: la vista tiene que leer auth.users, que
-- ningun rol de la app puede tocar. Corre con los permisos del dueno.
--
-- Por eso mismo el revoke NO ES OPCIONAL: sin el, cualquier usuario logueado
-- lista los emails y los telefonos de todos.

create view admin_usuarios as
  select p.id,
         p.nombre,
         p.apellido,
         p.whatsapp,
         p.created_at,
         u.email,
         -- banned_until queda en el pasado cuando se levanta el baneo, asi que
         -- la fecha sola no alcanza para saber si esta baneado ahora.
         u.banned_until,
         coalesce(u.banned_until > now(), false) as baneado,
         (select count(*) from paletas where vendedor_id = p.id) as paletas
    from perfiles p
    join auth.users u on u.id = p.id;

comment on view admin_usuarios is
  'Solo para el panel de superadmin. Corre con permisos del dueno para poder '
  'leer auth.users: no darle select a anon ni a authenticated.';

revoke all on admin_usuarios from public, anon, authenticated;
grant select on admin_usuarios to service_role;

-- ------------------------------------------------------- estadisticas_admin
-- Todo el resumen en una sola llamada y un solo jsonb. Son ~6 agregados sobre
-- tablas chicas; partirlo en varias RPC solo agregaria round trips.
--
-- ponytail: cuenta con count(*) sobre la tabla entera, sin cache. Con el
-- volumen actual son milisegundos. Si algun dia pesa, lo que entra es una
-- vista materializada refrescada por cron, no un contador incremental.

create function estadisticas_admin() returns jsonb
language sql
security definer
set search_path = public
as $$
  with meses as (
    -- Los 12 meses hasta el actual, incluso los que no tuvieron actividad:
    -- sin esto un mes vacio desaparece de la serie y el grafico miente.
    select generate_series(
             date_trunc('month', now()) - interval '11 months',
             date_trunc('month', now()),
             interval '1 month'
           ) as mes
  )
  select jsonb_build_object(
    'paletas', (
      select jsonb_build_object(
        -- "activa" de verdad es estado activa Y no vencida: una vencida no la
        -- ve nadie, aunque la columna siga diciendo 'activa'.
        'activas',  count(*) filter (where estado_publicacion = 'activa' and now() <  vence_at),
        'vencidas', count(*) filter (where estado_publicacion = 'activa' and now() >= vence_at),
        'pausadas', count(*) filter (where estado_publicacion = 'pausada'),
        'vendidas', count(*) filter (where estado_publicacion = 'vendida'),
        'bajas',    count(*) filter (where estado_publicacion = 'eliminada'),
        'total',    count(*)
      ) from paletas
    ),
    'promociones', (
      select jsonb_build_object(
        'activas', count(*) filter (where now() < hasta),
        'total',   count(*)
      ) from promociones
    ),
    'usuarios', (
      select jsonb_build_object(
        'total',    count(*),
        'baneados', count(*) filter (where baneado)
      ) from admin_usuarios
    ),
    -- Bruto: lo que cobro MercadoPago, sin descontar su comision (no la
    -- guardamos). Solo aprobados: pendiente y rechazado no son plata.
    'ganancia', (
      select coalesce(sum(monto), 0) from pagos where estado = 'aprobado'
    ),
    'historico', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'mes',          to_char(m.mes, 'YYYY-MM'),
               'paletas',      (select count(*) from paletas
                                 where date_trunc('month', created_at) = m.mes),
               'promociones',  (select count(*) from promociones
                                 where date_trunc('month', desde) = m.mes),
               'ingresos',     (select coalesce(sum(monto), 0) from pagos
                                 where estado = 'aprobado'
                                   and date_trunc('month', created_at) = m.mes)
             ) order by m.mes), '[]'::jsonb)
        from meses m
    )
  );
$$;

comment on function estadisticas_admin() is
  'Resumen del panel de superadmin en un solo jsonb. Solo service_role.';

-- security definer + una vista que saltea RLS: sin esto cualquier usuario
-- logueado se entera de cuanta plata entra.
revoke execute on function estadisticas_admin() from public, anon, authenticated;
grant execute on function estadisticas_admin() to service_role;

-- ---------------------------------------------------------------- checks
-- Misma convencion que el resto de las migraciones: si algo falla, la
-- transaccion se revierte entera y no queda nada aplicado.

do $checks$
declare
  u_a   uuid := gen_random_uuid();
  marca smallint;
  pal   uuid;
  baja  uuid;
  pag   uuid;
  e     jsonb;
  mes   text := to_char(now(), 'YYYY-MM');
  antes jsonb;
begin
  antes := estadisticas_admin();

  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-admin@example.com',
          '{"nombre":"Check","apellido":"Admin"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, marca, 'Check Admin', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion,
                       estado_publicacion)
  values (u_a, marca, 'Check Baja', 'Redonda', 2026, 8, 100000,
          'CABA', 'CABA', 'test', 'eliminada')
  returning id into baja;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-admin-' || u_a::text, 2000, 'aprobado', 'promocion')
  returning id into pag;

  insert into promociones (paleta_id, origen, pago_id, hasta)
  values (pal, 'individual', pag, now() + interval '15 days');

  e := estadisticas_admin();

  -- 1. los contadores se movieron con lo que acabamos de insertar
  assert (e #>> '{paletas,activas}')::int = (antes #>> '{paletas,activas}')::int + 1,
    'no conto la paleta activa nueva';
  assert (e #>> '{paletas,bajas}')::int = (antes #>> '{paletas,bajas}')::int + 1,
    'no conto la paleta dada de baja';
  assert (e #>> '{promociones,activas}')::int = (antes #>> '{promociones,activas}')::int + 1,
    'no conto la promocion vigente';
  assert (e #>> '{usuarios,total}')::int = (antes #>> '{usuarios,total}')::int + 1,
    'no conto el usuario nuevo';

  -- 2. la ganancia es bruta y solo de aprobados
  assert (e ->> 'ganancia')::bigint = (antes ->> 'ganancia')::bigint + 2000,
    'la ganancia no sumo el pago aprobado';

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-admin-rech-' || u_a::text, 9999, 'rechazado', 'promocion');

  assert (estadisticas_admin() ->> 'ganancia')::bigint = (e ->> 'ganancia')::bigint,
    'un pago rechazado no tendria que sumar a la ganancia';

  -- 3. una paleta vencida sale de activas y entra en vencidas
  update paletas set vence_at = now() - interval '1 day' where id = pal;
  assert (estadisticas_admin() #>> '{paletas,activas}')::int
         = (antes #>> '{paletas,activas}')::int,
    'una publicacion vencida no tendria que contar como activa';
  assert (estadisticas_admin() #>> '{paletas,vencidas}')::int
         = (antes #>> '{paletas,vencidas}')::int + 1,
    'una publicacion vencida tendria que contar como vencida';

  -- 4. el historico siempre trae 12 meses, incluso los vacios, y el ultimo es
  -- el mes corriente
  assert jsonb_array_length(e -> 'historico') = 12,
    'el historico tendria que traer 12 meses';
  assert (e #>> '{historico,11,mes}') = mes,
    'el ultimo mes del historico tendria que ser el corriente';
  assert (e #>> '{historico,11,paletas}')::int >= 2,
    'el mes corriente no refleja las paletas recien creadas';
  assert (e #>> '{historico,11,ingresos}')::bigint >= 2000,
    'el mes corriente no refleja el pago aprobado';

  -- 5. el baneo se ve en la vista
  assert not (select baneado from admin_usuarios where id = u_a),
    'un usuario recien creado no tendria que figurar baneado';
  update auth.users set banned_until = now() + interval '100 years' where id = u_a;
  assert (select baneado from admin_usuarios where id = u_a),
    'la vista no refleja el baneo';
  assert (select email from admin_usuarios where id = u_a) = 'check-admin@example.com',
    'la vista no expone el email';

  -- 6. lo que no puede pasar: que anon o authenticated lleguen a esto
  -- Calificados con el esquema: el search_path de quien corra la migracion no
  -- tiene por que incluir public, y sin eso el assert no encuentra el objeto.
  assert not has_table_privilege('anon', 'public.admin_usuarios', 'select'),
    'anon no puede tener select sobre admin_usuarios';
  assert not has_table_privilege('authenticated', 'public.admin_usuarios', 'select'),
    'authenticated no puede tener select sobre admin_usuarios';
  assert not has_function_privilege('authenticated', 'public.estadisticas_admin()', 'execute'),
    'authenticated no puede ejecutar estadisticas_admin';
  assert has_function_privilege('service_role', 'public.estadisticas_admin()', 'execute'),
    'service_role tiene que poder ejecutar estadisticas_admin';

  -- Teardown explicito y en este orden. Borrar el usuario a secas dispara dos
  -- cascadas a la vez: paletas -> promociones (delete) y pagos -> promociones
  -- (set null), y si gana la segunda el check `(origen='individual') =
  -- (pago_id is not null)` explota. No es problema del panel, pero tampoco hace
  -- falta apostar a que Postgres las ordene bien.
  delete from promociones where paleta_id in (pal, baja);
  delete from pagos where perfil_id = u_a;
  delete from auth.users where id = u_a;
end $checks$;
