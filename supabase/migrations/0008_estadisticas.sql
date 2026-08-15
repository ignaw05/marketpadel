-- marketpadel: el resumen del panel deja de ser un corte fijo.
--
-- 0007 devolvia siempre lo mismo: los totales de siempre mas 12 meses de
-- historico con 3 series. El panel ahora grafica y necesita elegir la ventana,
-- asi que la funcion pasa a tomar un rango.
--
-- El shape del jsonb cambia: se va `historico` y entran `serie` (la ventana
-- pedida, 5 series), `tipos` (promociones por origen) y `duraciones`
-- (promociones por plan de 15 o 30 dias). lib/admin-db.ts y app/admin/page.tsx
-- cambian en el mismo commit.
--
-- Lo que esta funcion NO puede responder, y por eso no lo intenta: cuanta
-- gente entra al sitio. La base no guarda visitas de pagina; eso lo mide
-- Vercel Analytics, que ya esta instalado. El panel linkea a ese dashboard.

drop function estadisticas_admin();

-- set timezone NO ES DECORATIVO: date_trunc sobre timestamptz usa el TimeZone
-- de la sesion, y en Supabase eso es UTC. Sin esto un "dia" del grafico
-- arranca a las 21:00 hora argentina y las ventas de la noche caen en el dia
-- siguiente. Los buckets diarios y semanales se calculan en hora local.
create function estadisticas_admin(p_rango text default 'mes') returns jsonb
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
    -- 'otras' no es relleno: las premium y las de cortesia las inserta otro
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

-- security definer + una vista que saltea RLS: sin esto cualquier usuario
-- logueado se entera de cuanta plata entra.
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
  ult   jsonb;
  antes jsonb;
  ok    boolean;
begin
  antes := estadisticas_admin('mes');

  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-stats@example.com',
          '{"nombre":"Check","apellido":"Stats"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, marca, 'Check Stats', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  -- Un pago por promocion: promociones_pago_idx es unico, y con razon. Cada
  -- plan se cobra por separado.
  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-stats-15-' || u_a::text, 2000, 'aprobado', 'promocion')
  returning id into pag;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-stats-30-' || u_a::text, 3000, 'aprobado', 'promocion')
  returning id into pag30;

  -- Una de cada plan mas una de cortesia con plazo fuera de los planes: las
  -- tres barras del grafico de duracion quedan cubiertas, y la de cortesia es
  -- justo el caso por el que existe el cajon 'otras'.
  insert into promociones (paleta_id, origen, pago_id, desde, hasta)
  values (pal, 'individual', pag,   now(), now() + interval '15 days'),
         (pal, 'individual', pag30, now(), now() + interval '30 days'),
         (pal, 'cortesia',   null,  now(), now() + interval '7 days');

  -- 1. cada rango trae exactamente los buckets que promete, incluidos los vacios
  assert jsonb_array_length(estadisticas_admin('dia')    -> 'serie') = 30,
    'el rango diario tendria que traer 30 dias';
  assert jsonb_array_length(estadisticas_admin('semana') -> 'serie') = 12,
    'el rango semanal tendria que traer 12 semanas';
  assert jsonb_array_length(estadisticas_admin('mes')    -> 'serie') = 12,
    'el rango mensual tendria que traer 12 meses';
  assert jsonb_array_length(estadisticas_admin('anio')   -> 'serie') = 5,
    'el rango anual tendria que traer 5 anios';
  assert jsonb_array_length(estadisticas_admin('total')  -> 'serie') >= 1,
    'el rango total tendria que traer al menos un mes';

  -- 2. el periodo corriente refleja lo que acabamos de insertar
  e   := estadisticas_admin('mes');
  ult := (e -> 'serie') -> -1;

  assert (ult ->> 'periodo') = to_char(date_trunc('month', now()), 'YYYY-MM-DD'),
    'el ultimo bucket del rango mensual tendria que ser el mes corriente';
  assert (ult ->> 'paletas')::int >= 1,
    'el mes corriente no refleja la paleta recien creada';
  assert (ult ->> 'ingresos')::bigint >= 2000,
    'el mes corriente no refleja el pago aprobado';
  assert (ult ->> 'usuarios')::int >= 1,
    'el mes corriente no refleja el usuario nuevo';
  assert (ult ->> 'promociones')::int >= 1,
    'el mes corriente no refleja la promocion nueva';

  -- 3. activos cuenta personas, no eventos: este usuario publico, pago Y
  -- promociono, y tiene que sumar uno solo.
  assert (ult ->> 'activos')::int
         = ((antes -> 'serie') -> -1 ->> 'activos')::int + 1,
    'un usuario con tres acciones en el periodo tendria que contar una vez';

  -- 4. los tipos de promocion abren por origen y las tres claves estan siempre
  assert (e #>> '{tipos,individual}')::int
         = (antes #>> '{tipos,individual}')::int + 2,
    'no conto las promociones individuales';
  assert (e #>> '{tipos,cortesia}')::int
         = (antes #>> '{tipos,cortesia}')::int + 1,
    'no conto la promocion de cortesia';
  assert (e -> 'tipos') ? 'premium' and (e -> 'tipos') ? 'cortesia',
    'los tres origenes tienen que estar presentes aunque den 0';

  -- 5. la duracion sale de hasta - desde y cada promo cae en su plan
  assert (e #>> '{duraciones,d15}')::int = (antes #>> '{duraciones,d15}')::int + 1,
    'la promocion de 15 dias no cayo en su plan';
  assert (e #>> '{duraciones,d30}')::int = (antes #>> '{duraciones,d30}')::int + 1,
    'la promocion de 30 dias no cayo en su plan';
  assert (e #>> '{duraciones,otras}')::int = (antes #>> '{duraciones,otras}')::int + 1,
    'una promocion de plazo distinto tendria que caer en otras';

  -- Lo que importa de verdad: las dos aperturas cuentan las mismas promos. Si
  -- un plazo nuevo no entra en ningun cajon, esto lo agarra.
  assert (e #>> '{duraciones,d15}')::int + (e #>> '{duraciones,d30}')::int
         + (e #>> '{duraciones,otras}')::int
         = (e #>> '{tipos,premium}')::int + (e #>> '{tipos,individual}')::int
         + (e #>> '{tipos,cortesia}')::int,
    'las dos aperturas de promociones tendrian que sumar lo mismo';

  -- 6. los totales no dependen del rango: son de siempre
  assert (estadisticas_admin('dia') -> 'paletas')
         = (estadisticas_admin('anio') -> 'paletas'),
    'los totales no tendrian que cambiar con el rango';

  -- 7. un rango que no existe falla en vez de devolver cualquier cosa
  ok := false;
  begin
    perform estadisticas_admin('quincenal');
  exception when others then ok := true;
  end;
  assert ok, 'un rango invalido tendria que fallar';

  -- 8. lo que no puede pasar: que anon o authenticated lleguen a esto
  assert not has_function_privilege('anon', 'public.estadisticas_admin(text)', 'execute'),
    'anon no puede ejecutar estadisticas_admin';
  assert not has_function_privilege('authenticated', 'public.estadisticas_admin(text)', 'execute'),
    'authenticated no puede ejecutar estadisticas_admin';
  assert has_function_privilege('service_role', 'public.estadisticas_admin(text)', 'execute'),
    'service_role tiene que poder ejecutar estadisticas_admin';

  -- Teardown en este orden por lo mismo que en 0007: borrar el usuario a secas
  -- dispara las dos cascadas a promociones a la vez y el check de origen
  -- explota.
  delete from promociones where paleta_id = pal;
  delete from pagos where perfil_id = u_a;
  delete from auth.users where id = u_a;
end $checks$;
