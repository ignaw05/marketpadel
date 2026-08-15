-- marketpadel: abrir las promociones tambien por duracion.
--
-- 0008 dejo el resumen del panel con las promociones abiertas por origen
-- (`tipos`). Falta la otra pregunta, que es la que decide el precio de los
-- planes: cuantas se compran de 15 dias y cuantas de 30.
--
-- Va en una migracion aparte y no editando 0008 porque 0008 YA CORRIO en
-- produccion. Una migracion aplicada es un registro de lo que paso, no un
-- archivo que se retoca: reescribirla dejaria el repo diciendo una cosa y la
-- base otra, y ademas 0008 arranca con un `drop function estadisticas_admin()`
-- que hoy ya no existe, asi que volver a correrla fallaria.
--
-- Unico cambio en la funcion: la clave `duraciones` del jsonb. Todo lo demas
-- queda igual, por eso es un create or replace del cuerpo completo (Postgres no
-- deja parchear media funcion).
--
-- La duracion no es una columna: se deriva de hasta - desde, que es exactamente
-- como la escribe registrar_promocion_pagada (0003).

create or replace function estadisticas_admin(p_rango text default 'mes') returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
declare
  -- Una sola unidad alimenta el date_trunc de cada serie y el paso del
  -- generate_series: no pueden desincronizarse.
  v_unidad text;
  v_desde  timestamptz;
  v_hasta  timestamptz := now();
begin
  case p_rango
    when 'dia'    then v_unidad := 'day';
    when 'semana' then v_unidad := 'week';
    when 'mes'    then v_unidad := 'month';
    when 'anio'   then v_unidad := 'year';
    -- 'total' es todo el historico agrupado por mes: no es una ventana movil,
    -- arranca en el primer dato que exista.
    when 'total'  then v_unidad := 'month';
    else raise exception 'rango invalido: %', p_rango;
  end case;

  v_desde := case p_rango
    when 'dia'    then date_trunc('day',   v_hasta) - interval '29 days'
    when 'semana' then date_trunc('week',  v_hasta) - interval '11 weeks'
    when 'mes'    then date_trunc('month', v_hasta) - interval '11 months'
    when 'anio'   then date_trunc('year',  v_hasta) - interval '4 years'
    -- least() ignora los NULL, asi que una tabla vacia no rompe el minimo; el
    -- coalesce cubre el caso de que esten vacias todas (proyecto recien
    -- creado): ahi la serie es un solo mes, el corriente.
    else date_trunc('month', coalesce(
           least(
             (select min(created_at) from perfiles),
             (select min(created_at) from paletas),
             (select min(created_at) from pagos),
             (select min(desde)      from promociones)
           ),
           v_hasta
         ))
  end;

  return jsonb_build_object(
    'rango',  p_rango,
    'unidad', v_unidad,

    -- ------------------------------------------------------------- totales
    -- Los de siempre, sin ventana: son las tarjetas de arriba y no cambian
    -- cuando cambia el rango.
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

    -- --------------------------------------------------- tipos de promocion
    -- Los tres origenes siempre presentes, aunque den 0: si falta una clave el
    -- grafico se queda sin la categoria y parece que ese tipo no existe.
    'tipos', (
      select jsonb_build_object(
        'premium',    count(*) filter (where origen = 'premium'),
        'individual', count(*) filter (where origen = 'individual'),
        'cortesia',   count(*) filter (where origen = 'cortesia')
      ) from promociones where desde >= v_desde
    ),


    -- ------------------------------------------------ duracion de la promocion
    -- Los dos planes que se venden (PLANES en lib/paletas.ts) son de 15 y 30
    -- dias. La duracion no esta guardada como columna: se deriva de hasta -
    -- desde, que es exactamente como la escribe registrar_promocion_pagada.
    --
    -- otras no es relleno: las premium y las de cortesia las inserta otro
    -- camino y pueden traer cualquier plazo. Sin ese cajon, la suma de las
    -- barras no daria el total y el grafico mentiria.
    'duraciones', (
      select jsonb_build_object(
        'd15',   count(*) filter (where dias = 15),
        'd30',   count(*) filter (where dias = 30),
        'otras', count(*) filter (where dias not in (15, 30))
      ) from (
        -- round y no trunc: 30 dias de calendario pueden dar 29.96 si en el
        -- medio hubo cambio de huso, y truncando eso caeria en 'otras'.
        select round(extract(epoch from (hasta - desde)) / 86400)::int as dias
          from promociones where desde >= v_desde
      ) p
    ),

    -- ---------------------------------------------------------------- serie
    -- generate_series y no group by: un periodo sin actividad tiene que salir
    -- con 0, no desaparecer. Un grafico al que le faltan las barras vacias
    -- miente sobre la tendencia.
    --
    -- ponytail: un subselect por metrica y por bucket, sin indices nuevos.
    -- Son 30 buckets como maximo sobre tablas chicas. Si algun dia pesa, lo
    -- que entra es una vista materializada refrescada por cron.
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'periodo',     to_char(b.bucket, 'YYYY-MM-DD'),
               'paletas',     (select count(*) from paletas
                                where date_trunc(v_unidad, created_at) = b.bucket),
               'promociones', (select count(*) from promociones
                                where date_trunc(v_unidad, desde) = b.bucket),
               'ingresos',    (select coalesce(sum(monto), 0) from pagos
                                where estado = 'aprobado'
                                  and date_trunc(v_unidad, created_at) = b.bucket),
               'usuarios',    (select count(*) from perfiles
                                where date_trunc(v_unidad, created_at) = b.bucket),
               -- Activo = hizo algo en el periodo: publico, pago o promociono.
               -- No es "entro al sitio": para eso esta Vercel Analytics. El
               -- distinct es sobre la union, no por tabla: el que publica y
               -- ademas paga es una persona sola.
               'activos',     (select count(distinct u.id) from (
                                 select vendedor_id as id from paletas
                                  where date_trunc(v_unidad, created_at) = b.bucket
                                 union all
                                 select perfil_id from pagos
                                  where estado = 'aprobado'
                                    and date_trunc(v_unidad, created_at) = b.bucket
                                 union all
                                 select p.vendedor_id from promociones pr
                                   join paletas p on p.id = pr.paleta_id
                                  where date_trunc(v_unidad, pr.desde) = b.bucket
                               ) u)
             ) order by b.bucket), '[]'::jsonb)
        from generate_series(v_desde,
                             date_trunc(v_unidad, v_hasta),
                             ('1 ' || v_unidad)::interval) as b(bucket)
    )
  );
end $$;
comment on function estadisticas_admin(text) is
  'Resumen del panel de superadmin en un solo jsonb. p_rango: dia, semana, '
  'mes, anio o total. Solo service_role.';

-- create or replace NO conserva los grants de la funcion vieja en cuanto a
-- PUBLIC: Postgres le vuelve a dar execute a public en cada create. Repetir el
-- revoke no es defensivo de mas, es lo que impide que cualquier usuario
-- logueado se entere de cuanta plata entra.
revoke execute on function estadisticas_admin(text) from public, anon, authenticated;
grant execute on function estadisticas_admin(text) to service_role;

-- ---------------------------------------------------------------- checks
-- Misma convencion que el resto de las migraciones: si algo falla, la
-- transaccion se revierte entera y no queda nada aplicado.

do $checks$
declare
  u_a   uuid := gen_random_uuid();
  marca smallint;
  pal   uuid;
  pag   uuid;
  pag30 uuid;
  e     jsonb;
  antes jsonb;
begin
  antes := estadisticas_admin('mes');

  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-duracion@example.com',
          '{"nombre":"Check","apellido":"Duracion"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, marca, 'Check Duracion', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  -- Un pago por promocion: promociones_pago_idx es unico, y con razon. Cada
  -- plan se cobra por separado.
  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-dur-15-' || u_a::text, 2000, 'aprobado', 'promocion')
  returning id into pag;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-dur-30-' || u_a::text, 3000, 'aprobado', 'promocion')
  returning id into pag30;

  -- Una de cada plan mas una de cortesia con plazo fuera de los planes: las
  -- tres barras del grafico quedan cubiertas, y la de cortesia es justo el caso
  -- por el que existe el cajon 'otras'.
  insert into promociones (paleta_id, origen, pago_id, desde, hasta)
  values (pal, 'individual', pag,   now(), now() + interval '15 days'),
         (pal, 'individual', pag30, now(), now() + interval '30 days'),
         (pal, 'cortesia',   null,  now(), now() + interval '7 days');

  e := estadisticas_admin('mes');

  -- 1. cada promo cae en el plan que le corresponde
  assert (e #>> '{duraciones,d15}')::int = (antes #>> '{duraciones,d15}')::int + 1,
    'la promocion de 15 dias no cayo en su plan';
  assert (e #>> '{duraciones,d30}')::int = (antes #>> '{duraciones,d30}')::int + 1,
    'la promocion de 30 dias no cayo en su plan';
  assert (e #>> '{duraciones,otras}')::int = (antes #>> '{duraciones,otras}')::int + 1,
    'una promocion de plazo distinto tendria que caer en otras';

  -- 2. lo que importa de verdad: las dos aperturas cuentan las mismas promos.
  -- Si manana aparece un plan nuevo y no entra en ningun cajon, esto lo agarra.
  assert (e #>> '{duraciones,d15}')::int + (e #>> '{duraciones,d30}')::int
         + (e #>> '{duraciones,otras}')::int
         = (e #>> '{tipos,premium}')::int + (e #>> '{tipos,individual}')::int
         + (e #>> '{tipos,cortesia}')::int,
    'las dos aperturas de promociones tendrian que sumar lo mismo';

  -- 3. el resto del resumen no se movio: esto solo agrega una clave
  assert (e -> 'serie') is not null and jsonb_array_length(e -> 'serie') = 12,
    'el create or replace se comio la serie';
  assert (e -> 'paletas') is not null and (e -> 'ganancia') is not null,
    'el create or replace se comio los totales';

  -- 4. los grants siguen cerrados despues del replace
  assert not has_function_privilege('anon', 'public.estadisticas_admin(text)', 'execute'),
    'anon no puede ejecutar estadisticas_admin';
  assert not has_function_privilege('authenticated', 'public.estadisticas_admin(text)', 'execute'),
    'authenticated no puede ejecutar estadisticas_admin';
  assert has_function_privilege('service_role', 'public.estadisticas_admin(text)', 'execute'),
    'service_role tiene que poder ejecutar estadisticas_admin';

  -- Teardown en este orden por lo mismo que en 0007: borrar el usuario a secas
  -- dispara las dos cascadas a promociones a la vez y el check de origen explota.
  delete from promociones where paleta_id = pal;
  delete from pagos where perfil_id = u_a;
  delete from auth.users where id = u_a;
end $checks$;
