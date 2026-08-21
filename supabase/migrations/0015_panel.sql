-- marketpadel: el panel deja de ser un resumen y pasa a ser cuatro pantallas.
--
-- 0008 (con el parche de 0009) dejo todo el panel colgando de una sola RPC,
-- `estadisticas_admin`, que devolvia seis totales y cinco series. Se queda
-- corta para lo que el panel tiene que responder ahora: no abre los pagos por
-- concepto (las donaciones de 0011 y las suscripciones Pro de 0013 son
-- invisibles), no dice nada del catalogo (marcas, provincias, precios) ni de la
-- gente (embudo, top vendedores), y sobre todo no marca nada accionable.
--
-- Se parte en cuatro funciones, una por pantalla, en vez de engordar el jsonb
-- unico: cada pantalla es su propia ruta y hoy TODAS pagarian el agregado
-- completo para dibujar un cuarto de el.
--
--   panel_resumen(rango)   /admin
--   panel_dinero(rango)    /admin/dinero
--   panel_catalogo()       /admin/catalogo
--   panel_gente()          /admin/usuarios
--
-- Catalogo y gente NO toman rango a proposito: son fotos del estado actual
-- ("como esta el catalogo hoy"), no ventanas moviles. Meterles un selector
-- obligaria a inventar que significa "las marcas de la semana pasada".
--
-- Lo que sigue sin poder responder, igual que 0008: cuanta gente entra al
-- sitio. Eso lo mide Vercel Analytics y el panel linkea a ese dashboard.
--
-- ATENCION: esta migracion NO toca `paletas_publicas` ni depende de
-- `paletas.promocionada_hasta` (0006, que en produccion no esta aplicada) ni de
-- `perfiles.provincia` (0014, idem). El corte geografico usa
-- `paletas.provincia`, que existe desde 0001.

drop function estadisticas_admin(text);

-- ---------------------------------------------------------------- ventana
-- El calculo de la ventana estaba repetido adentro de estadisticas_admin y
-- ahora lo necesitan dos funciones. Sale afuera para que la unidad del
-- date_trunc y el paso del generate_series no puedan desincronizarse, y para
-- que `desde_prev` -- la novedad de esta migracion -- se defina una sola vez.
--
-- set timezone NO ES DECORATIVO, misma razon que en 0008: date_trunc sobre
-- timestamptz usa el TimeZone de la sesion, y en Supabase eso es UTC. Sin esto
-- un "dia" arranca a las 21:00 hora argentina y las ventas de la noche caen en
-- el dia siguiente.
create function panel_ventana(
  p_rango         text,
  out unidad      text,
  out desde       timestamptz,
  out desde_prev  timestamptz,
  out hasta       timestamptz
)
language plpgsql
stable
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
begin
  hasta := now();

  case p_rango
    when 'dia'    then unidad := 'day';
    when 'semana' then unidad := 'week';
    when 'mes'    then unidad := 'month';
    when 'anio'   then unidad := 'year';
    -- 'total' es todo el historico agrupado por mes: no es una ventana movil,
    -- arranca en el primer dato que exista.
    when 'total'  then unidad := 'month';
    else raise exception 'rango invalido: %', p_rango;
  end case;

  desde := case p_rango
    when 'dia'    then date_trunc('day',   hasta) - interval '29 days'
    when 'semana' then date_trunc('week',  hasta) - interval '11 weeks'
    when 'mes'    then date_trunc('month', hasta) - interval '11 months'
    when 'anio'   then date_trunc('year',  hasta) - interval '4 years'
    -- least() ignora los NULL, asi que una tabla vacia no rompe el minimo; el
    -- coalesce cubre el caso de que esten vacias todas (proyecto recien
    -- creado): ahi la serie es un solo mes, el corriente.
    else date_trunc('month', coalesce(
           least(
             (select min(created_at) from perfiles),
             (select min(created_at) from paletas),
             (select min(created_at) from pagos),
             -- El alias NO ES OPCIONAL: `desde` es a la vez un parametro OUT
             -- de esta funcion y una columna de promociones, y sin calificar
             -- la referencia PL/pgSQL aborta por ambigua.
             (select min(pr.desde)   from promociones pr)
           ),
           hasta
         ))
  end;

  -- La ventana anterior del mismo tamano, que es contra lo que se compara.
  -- 'total' se queda en NULL a proposito: no hay un "antes de todo el
  -- historico", y devolver 0 haria que la UI dibuje una caida del 100%.
  desde_prev := case p_rango
    when 'dia'    then desde - interval '30 days'
    when 'semana' then desde - interval '12 weeks'
    when 'mes'    then desde - interval '12 months'
    when 'anio'   then desde - interval '5 years'
    else null
  end;
end $$;

comment on function panel_ventana(text) is
  'Ventana del panel para un rango: unidad de bucket, inicio, inicio de la '
  'ventana anterior (null en total) y ahora.';

-- ---------------------------------------------------------------- resumen

create function panel_resumen(p_rango text default 'mes') returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
declare
  v record;
begin
  select * into v from panel_ventana(p_rango);

  return jsonb_build_object(
    'rango',      p_rango,
    'unidad',     v.unidad,
    -- Si es false la UI no dibuja ninguna variacion: no hay contra que comparar.
    'comparable', v.desde_prev is not null,

    -- ------------------------------------------------------------- totales
    -- Los de siempre, sin ventana: son las tarjetas de arriba y no cambian
    -- cuando cambia el rango. No incluye baneados: no es un indicador que
    -- sirva para decidir nada.
    'totales', (
      select jsonb_build_object(
        -- "activa" de verdad es estado activa Y no vencida: una vencida no la
        -- ve nadie, aunque la columna siga diciendo 'activa'.
        'activas',  count(*) filter (where estado_publicacion = 'activa' and now() <  vence_at),
        'vencidas', count(*) filter (where estado_publicacion = 'activa' and now() >= vence_at),
        'pausadas', count(*) filter (where estado_publicacion = 'pausada'),
        'vendidas', count(*) filter (where estado_publicacion = 'vendida'),
        'bajas',    count(*) filter (where estado_publicacion = 'eliminada'),
        'total',    count(*),
        'visitas',  coalesce(sum(visitas), 0)
      ) from paletas
    ),
    'promociones_vigentes', (select count(*) from promociones where now() < hasta),
    'usuarios',             (select count(*) from perfiles),
    -- Bruto historico: lo que cobro MercadoPago desde siempre, sin descontar
    -- su comision (no la guardamos). Solo aprobados: pendiente y rechazado no
    -- son plata.
    'ganancia',             (select coalesce(sum(monto), 0) from pagos where estado = 'aprobado'),
    -- Cuanto tarda en venderse, en dias. Es la unica medida de si el
    -- marketplace funciona; null mientras no haya ninguna vendida.
    'dias_hasta_venta', (
      select round(avg(extract(epoch from (updated_at - created_at)) / 86400)::numeric, 1)
        from paletas where estado_publicacion = 'vendida'
    ),

    -- ------------------------------------------------------------- periodo
    'periodo', jsonb_build_object(
      'paletas',     (select count(*) from paletas where created_at >= v.desde),
      'promociones', (select count(*) from promociones where desde >= v.desde),
      'ingresos',    (select coalesce(sum(monto), 0) from pagos
                       where estado = 'aprobado' and created_at >= v.desde),
      'usuarios',    (select count(*) from perfiles where created_at >= v.desde)
    ),

    -- La misma ventana corrida hacia atras. NULL entero cuando no hay ventana
    -- anterior, asi la UI distingue "no hubo movimiento" de "no se puede
    -- comparar".
    'anterior', case when v.desde_prev is null then null else jsonb_build_object(
      'paletas',     (select count(*) from paletas
                       where created_at >= v.desde_prev and created_at < v.desde),
      'promociones', (select count(*) from promociones
                       where desde >= v.desde_prev and desde < v.desde),
      'ingresos',    (select coalesce(sum(monto), 0) from pagos
                       where estado = 'aprobado'
                         and created_at >= v.desde_prev and created_at < v.desde),
      'usuarios',    (select count(*) from perfiles
                       where created_at >= v.desde_prev and created_at < v.desde)
    ) end,

    -- ------------------------------------------------------------ atencion
    -- Lo unico de esta funcion que pide una accion, no que informa. Cada clave
    -- corresponde a una fila clickeable del panel; la UI esconde las que dan 0.
    'atencion', jsonb_build_object(
      'vencen_pronto', (select count(*) from paletas
                         where estado_publicacion = 'activa'
                           and vence_at > now() and vence_at <= now() + interval '7 days'),
      'ya_vencidas',   (select count(*) from paletas
                         where estado_publicacion = 'activa' and vence_at <= now()),
      -- Activas sin una sola foto: estan en el feed con el placeholder.
      'sin_foto',      (select count(*) from paletas
                         where estado_publicacion = 'activa'
                           and now() < vence_at
                           and cardinality(fotos) = 0),
      -- Plata que se intento cobrar y no entro. Va por la ventana del rango:
      -- un rechazo de hace ocho meses no es una tarea pendiente.
      'pagos_problema', (select count(*) from pagos
                          where estado in ('rechazado', 'devuelto', 'pendiente')
                            and created_at >= v.desde)
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
                                where date_trunc(v.unidad, created_at) = b.bucket),
               'promociones', (select count(*) from promociones
                                where date_trunc(v.unidad, desde) = b.bucket),
               'ingresos',    (select coalesce(sum(monto), 0) from pagos
                                where estado = 'aprobado'
                                  and date_trunc(v.unidad, created_at) = b.bucket),
               'usuarios',    (select count(*) from perfiles
                                where date_trunc(v.unidad, created_at) = b.bucket),
               -- Activo = hizo algo en el periodo: publico, pago o promociono.
               -- No es "entro al sitio": para eso esta Vercel Analytics. El
               -- distinct es sobre la union, no por tabla: el que publica y
               -- ademas paga es una persona sola.
               'activos',     (select count(distinct u.id) from (
                                 select vendedor_id as id from paletas
                                  where date_trunc(v.unidad, created_at) = b.bucket
                                 union all
                                 select perfil_id from pagos
                                  where estado = 'aprobado'
                                    and date_trunc(v.unidad, created_at) = b.bucket
                                 union all
                                 select p.vendedor_id from promociones pr
                                   join paletas p on p.id = pr.paleta_id
                                  where date_trunc(v.unidad, pr.desde) = b.bucket
                               ) u)
             ) order by b.bucket), '[]'::jsonb)
        from generate_series(v.desde,
                             date_trunc(v.unidad, v.hasta),
                             ('1 ' || v.unidad)::interval) as b(bucket)
    )
  );
end $$;

-- ---------------------------------------------------------------- dinero

create function panel_dinero(p_rango text default 'mes') returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
declare
  v record;
begin
  select * into v from panel_ventana(p_rango);

  return jsonb_build_object(
    'rango',      p_rango,
    'unidad',     v.unidad,
    'comparable', v.desde_prev is not null,

    'bruto', jsonb_build_object(
      'periodo',   (select coalesce(sum(monto), 0) from pagos
                     where estado = 'aprobado' and created_at >= v.desde),
      'anterior',  case when v.desde_prev is null then null else
                   (select coalesce(sum(monto), 0) from pagos
                     where estado = 'aprobado'
                       and created_at >= v.desde_prev and created_at < v.desde) end,
      'historico', (select coalesce(sum(monto), 0) from pagos where estado = 'aprobado')
    ),

    -- nullif contra la division por cero: con cero pagos en la ventana, que es
    -- el caso normal en un proyecto nuevo, las dos salen null y la UI muestra
    -- el estado vacio en vez de NaN.
    'ticket', (
      select round(avg(monto)) from pagos
       where estado = 'aprobado' and created_at >= v.desde
    ),
    'tasa_aprobacion', (
      select round(
               100.0 * count(*) filter (where estado = 'aprobado')
                     / nullif(count(*), 0)
             ) from pagos where created_at >= v.desde
    ),
    'pagos', jsonb_build_object(
      'total',     (select count(*) from pagos where created_at >= v.desde),
      'aprobados', (select count(*) from pagos
                     where estado = 'aprobado' and created_at >= v.desde)
    ),

    -- Los tres conceptos siempre presentes, aunque den 0: si falta una clave
    -- el grafico se queda sin la categoria y parece que ese concepto no
    -- existe. Son montos, no cantidades: la pregunta es de donde sale la plata.
    'por_concepto', (
      select jsonb_build_object(
        'promocion',   coalesce(sum(monto) filter (where concepto = 'promocion'),   0),
        'suscripcion', coalesce(sum(monto) filter (where concepto = 'suscripcion'), 0),
        'donacion',    coalesce(sum(monto) filter (where concepto = 'donacion'),    0)
      ) from pagos where estado = 'aprobado' and created_at >= v.desde
    ),

    -- Estos si son cantidades: intentos de cobro, no plata. Es lo que da la
    -- tasa de aprobacion su contexto.
    'por_estado', (
      select jsonb_build_object(
        'aprobado',  count(*) filter (where estado = 'aprobado'),
        'pendiente', count(*) filter (where estado = 'pendiente'),
        'rechazado', count(*) filter (where estado = 'rechazado'),
        'devuelto',  count(*) filter (where estado = 'devuelto')
      ) from pagos where created_at >= v.desde
    ),

    -- Promociones del rango abiertas por origen y por plan. Se mudan aca desde
    -- el resumen de 0008: son una pregunta de precios, no de actividad.
    'tipos', (
      select jsonb_build_object(
        'premium',    count(*) filter (where origen = 'premium'),
        'individual', count(*) filter (where origen = 'individual'),
        'cortesia',   count(*) filter (where origen = 'cortesia')
      ) from promociones where desde >= v.desde
    ),
    -- La duracion no es una columna: se deriva de hasta - desde, que es
    -- exactamente como la escribe registrar_promocion_pagada (0003). `otras`
    -- junta todo lo que no es 15 ni 30 dias: premium y cortesia entran por
    -- otro camino y pueden traer cualquier plazo.
    'duraciones', (
      select jsonb_build_object(
        'd15',   count(*) filter (where hasta - desde between interval '14 days' and interval '16 days'),
        'd30',   count(*) filter (where hasta - desde between interval '29 days' and interval '31 days'),
        'otras', count(*) filter (where not (hasta - desde between interval '14 days' and interval '16 days')
                                    and not (hasta - desde between interval '29 days' and interval '31 days'))
      ) from promociones where desde >= v.desde
    ),

    -- Vendedor Pro. Los creditos no se acumulan y se cuentan por fila de
    -- `suscripciones` (0001): 3 por periodo, y renovar inserta una fila nueva.
    'suscripciones', jsonb_build_object(
      'vigentes',         (select count(*) from suscripciones where now() between desde and hasta),
      'pro_vigentes',     (select count(*) from perfiles where pro_hasta > now()),
      'creditos_usados',  (select count(*) from promociones pr
                            join suscripciones s on s.id = pr.suscripcion_id
                           where now() between s.desde and s.hasta),
      'creditos_totales', (select 3 * count(*) from suscripciones where now() between desde and hasta)
    ),

    -- Los ultimos movimientos, tal cual, sin agregar. Con este volumen se lee
    -- la tabla entera y es lo que mas rapido contesta "que paso".
    'ultimos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id',         u.id,
               'concepto',   u.concepto,
               'estado',     u.estado,
               'monto',      u.monto,
               'created_at', u.created_at,
               'persona',    coalesce(nullif(trim(u.nombre || ' ' || u.apellido), ''), 'Sin nombre')
             ) order by u.created_at desc), '[]'::jsonb)
        from (
          select pg.id, pg.concepto, pg.estado, pg.monto, pg.created_at,
                 pf.nombre, pf.apellido
            from pagos pg
            join perfiles pf on pf.id = pg.perfil_id
           order by pg.created_at desc
           limit 15
        ) u
    )
  );
end $$;

-- ---------------------------------------------------------------- catalogo

create function panel_catalogo() returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
begin
  return jsonb_build_object(
    'total',   (select count(*) from paletas),
    'activas', (select count(*) from paletas
                 where estado_publicacion = 'activa' and now() < vence_at),

    'precio', (
      select jsonb_build_object(
        'promedio', round(avg(precio)),
        'mediana',  round(percentile_cont(0.5) within group (order by precio)::numeric),
        'min',      min(precio),
        'max',      max(precio)
      ) from paletas
    ),
    'precio_vendidas', (
      select round(avg(precio)) from paletas where estado_publicacion = 'vendida'
    ),

    'visitas', (
      select jsonb_build_object(
        'total',    coalesce(sum(visitas), 0),
        -- nullif: un catalogo vacio da null, no una division por cero.
        'promedio', round(coalesce(sum(visitas), 0)::numeric / nullif(count(*), 0), 1)
      ) from paletas
    ),

    'dias_hasta_venta', (
      select jsonb_build_object(
        'promedio', round(avg(d)::numeric, 1),
        'mediana',  round(percentile_cont(0.5) within group (order by d)::numeric, 1)
      ) from (
        select extract(epoch from (updated_at - created_at)) / 86400 as d
          from paletas where estado_publicacion = 'vendida'
      ) x
    ),

    'permuta', (
      select jsonb_build_object(
        'si',      count(*) filter (where acepta_permuta),
        'activas', count(*)
      ) from paletas where estado_publicacion = 'activa' and now() < vence_at
    ),

    -- Top 8 y no la lista entera: hay mas de cien marcas cargadas y un ranking
    -- de cien barras no es un ranking.
    'marcas', (
      with conteo as (
        select m.nombre, count(*)::int as n
          from paletas p join marcas m on m.id = p.marca_id
         group by m.nombre
      ),
      posiciones as (
        select nombre, n, row_number() over (order by n desc, nombre) as pos from conteo
      ),
      filas as (
        select pos::int as orden, nombre, n, null::int as agrupadas
          from posiciones where pos <= 8
        union all
        -- El resto plegado en una fila. `agrupadas` dice cuantas quedaron
        -- adentro; en las filas reales es null. El having descarta la fila
        -- cuando no sobro ninguna.
        select 999, 'Otras marcas', sum(n)::int, count(*)::int
          from posiciones where pos > 8
        having count(*) > 0
      )
      select coalesce(jsonb_agg(
               jsonb_build_object('nombre', nombre, 'n', n, 'agrupadas', agrupadas)
               order by orden), '[]'::jsonb)
        from filas
    ),

    'provincias', (
      with conteo as (
        select provincia as nombre, count(*)::int as n
          from paletas group by provincia
      ),
      posiciones as (
        select nombre, n, row_number() over (order by n desc, nombre) as pos from conteo
      ),
      filas as (
        select pos::int as orden, nombre, n, null::int as agrupadas
          from posiciones where pos <= 8
        union all
        -- El resto plegado en una fila. `agrupadas` dice cuantas quedaron
        -- adentro; en las filas reales es null. El having descarta la fila
        -- cuando no sobro ninguna.
        select 999, 'Otras provincias', sum(n)::int, count(*)::int
          from posiciones where pos > 8
        having count(*) > 0
      )
      select coalesce(jsonb_agg(
               jsonb_build_object('nombre', nombre, 'n', n, 'agrupadas', agrupadas)
               order by orden), '[]'::jsonb)
        from filas
    ),

    -- Cortes fijos, no cuantiles: son los escalones con los que se piensa un
    -- precio en pesos, y no se mueven cuando entra una paleta cara.
    'precios', (
      select jsonb_build_object(
        'b1', count(*) filter (where precio <  100000),
        'b2', count(*) filter (where precio >= 100000 and precio < 200000),
        'b3', count(*) filter (where precio >= 200000 and precio < 300000),
        'b4', count(*) filter (where precio >= 300000 and precio < 500000),
        'b5', count(*) filter (where precio >= 500000)
      ) from paletas
    ),

    'formas', (
      select jsonb_build_object(
        'diamante', count(*) filter (where forma = 'Diamante'),
        'lagrima',  count(*) filter (where forma = 'Lágrima'),
        'redonda',  count(*) filter (where forma = 'Redonda')
      ) from paletas
    ),

    -- El estado declarado, 1 a 10. Los diez siempre presentes: un hueco en el
    -- medio del histograma es informacion, no una fila que falta.
    'estado', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'valor', g,
               'n', (select count(*) from paletas where estado = g)
             ) order by g), '[]'::jsonb)
        from generate_series(1, 10) as g
    ),

    'top_visitas', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', t.id, 'marca', t.marca, 'modelo', t.modelo,
               'provincia', t.provincia, 'precio', t.precio, 'visitas', t.visitas
             ) order by t.visitas desc, t.modelo), '[]'::jsonb)
        from (select p.id, m.nombre as marca, p.modelo, p.provincia, p.precio, p.visitas
                from paletas p join marcas m on m.id = p.marca_id
               where p.visitas > 0
               order by p.visitas desc, p.modelo limit 10) t
    )
  );
end $$;

-- ------------------------------------------------------------------ gente

create function panel_gente() returns jsonb
language plpgsql
security definer
set search_path = public
set timezone = 'America/Argentina/Buenos_Aires'
as $$
declare
  v_registrados int := (select count(*) from perfiles);
  v_publicaron  int := (select count(distinct vendedor_id) from paletas);
begin
  return jsonb_build_object(
    -- El embudo cuenta PERSONAS distintas en cada escalon, no eventos. Los
    -- escalones no son subconjuntos estrictos (se puede vender sin haber
    -- promocionado nunca), asi que el porcentaje entre dos es informativo, no
    -- una particion.
    'embudo', jsonb_build_object(
      'registrados',   v_registrados,
      'publicaron',    v_publicaron,
      'promocionaron', (select count(distinct p.vendedor_id)
                          from promociones pr join paletas p on p.id = pr.paleta_id),
      'vendieron',     (select count(distinct vendedor_id) from paletas
                         where estado_publicacion = 'vendida')
    ),
    -- El escalon mas caro del embudo, aparte: es la unica cifra del panel que
    -- senala una oportunidad y no un hecho.
    'sin_publicar', v_registrados - v_publicaron,
    'pro_vigentes', (select count(*) from perfiles where pro_hasta > now()),

    'top_vendedores', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', t.id, 'nombre', t.nombre,
               'paletas', t.paletas, 'vendidas', t.vendidas, 'visitas', t.visitas
             ) order by t.paletas desc, t.visitas desc, t.nombre), '[]'::jsonb)
        from (
          select pf.id,
                 coalesce(nullif(trim(pf.nombre || ' ' || pf.apellido), ''), 'Sin nombre') as nombre,
                 count(*) as paletas,
                 count(*) filter (where p.estado_publicacion = 'vendida') as vendidas,
                 coalesce(sum(p.visitas), 0) as visitas
            from paletas p join perfiles pf on pf.id = p.vendedor_id
           group by pf.id, pf.nombre, pf.apellido
           order by paletas desc, visitas desc, nombre
           limit 10
        ) t
    )
  );
end $$;

comment on function panel_resumen(text)  is 'Pantalla /admin. p_rango: dia, semana, mes, anio o total. Solo service_role.';
comment on function panel_dinero(text)   is 'Pantalla /admin/dinero. Mismo p_rango que panel_resumen. Solo service_role.';
comment on function panel_catalogo()     is 'Pantalla /admin/catalogo. Foto del catalogo actual, sin ventana. Solo service_role.';
comment on function panel_gente()        is 'Bloque de /admin/usuarios: embudo y top vendedores. Solo service_role.';

-- security definer + lecturas que saltean RLS: sin esto cualquier usuario
-- logueado se entera de cuanta plata entra y de los nombres de todo el mundo.
revoke execute on function panel_ventana(text)  from public, anon, authenticated;
revoke execute on function panel_resumen(text)  from public, anon, authenticated;
revoke execute on function panel_dinero(text)   from public, anon, authenticated;
revoke execute on function panel_catalogo()     from public, anon, authenticated;
revoke execute on function panel_gente()        from public, anon, authenticated;

grant execute on function panel_ventana(text)  to service_role;
grant execute on function panel_resumen(text)  to service_role;
grant execute on function panel_dinero(text)   to service_role;
grant execute on function panel_catalogo()     to service_role;
grant execute on function panel_gente()        to service_role;

-- ---------------------------------------------------------------- checks
-- Misma convencion que el resto de las migraciones: si algo falla, la
-- transaccion se revierte entera y no queda nada aplicado.
--
-- Todas las variables van con prefijo v_: adentro de un bloque PL/pgSQL una
-- variable que se llame igual que una columna (marca, precio, estado) hace que
-- la referencia sea ambigua y el assert falle por el motivo equivocado.

do $checks$
declare
  v_u      uuid := gen_random_uuid();
  v_marca  smallint;
  v_pal    uuid;
  v_venc   uuid;
  v_promo  uuid;
  v_pag    uuid;
  v_vent   record;
  v_r      jsonb;
  v_d      jsonb;
  v_c      jsonb;
  v_g      jsonb;
  v_antes  jsonb;
  v_ok     boolean;
begin
  v_antes := panel_resumen('mes');

  -- ------------------------------------------------------------- ventana
  select * into v_vent from panel_ventana('dia');
  assert v_vent.unidad = 'day', 'el rango diario tendria que ser day';
  assert v_vent.desde_prev = v_vent.desde - interval '30 days',
    'la ventana anterior del rango diario tendria que ser los 30 dias previos';

  select * into v_vent from panel_ventana('total');
  assert v_vent.unidad = 'month', 'total agrupa por mes';
  assert v_vent.desde_prev is null,
    'total no tiene ventana anterior: desde_prev tiene que ser null';

  v_ok := false;
  begin
    perform panel_ventana('quincenal');
  exception when others then v_ok := true;
  end;
  assert v_ok, 'un rango invalido tendria que fallar';

  -- ---------------------------------------------------------------- datos
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_u, 'check-panel@example.com',
          '{"nombre":"Check","apellido":"Panel"}'::jsonb);

  select id into v_marca from marcas limit 1;

  -- Tres paletas, una por cada cosa que hay que probar por separado. La que
  -- vence pronto NO puede ser la que se promociona: el trigger
  -- promociones_renovar_paleta (0005) le empuja vence_at a 30 dias y dejaria
  -- de estar por vencer.
  --
  -- 1. Activa, con foto, vence en tres dias: solo 'vencen_pronto'.
  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion, fotos, vence_at)
  values (v_u, v_marca, 'Check Panel', 'Diamante', 2026, 9, 250000,
          'Check Provincia', 'Check Ciudad', 'test', array['x.jpg'],
          now() + interval '3 days')
  returning id into v_pal;

  -- 2. Activa, SIN foto y ya vencida: solo 'ya_vencidas'. Que no aparezca
  -- ademas en 'sin_foto' es justamente lo que se prueba abajo.
  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion, vence_at)
  values (v_u, v_marca, 'Check Vencida', 'Redonda', 2026, 5, 90000,
          'Check Provincia', 'Check Ciudad', 'test', now() - interval '1 day')
  returning id into v_venc;

  -- 3. Activa, SIN foto y vigente: solo 'sin_foto'. Es la que se promociona.
  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (v_u, v_marca, 'Check Promo', 'Lágrima', 2026, 7, 250000,
          'Check Provincia', 'Check Ciudad', 'test')
  returning id into v_promo;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (v_u, 'check-panel-ok-' || v_u::text, 2000, 'aprobado', 'promocion')
  returning id into v_pag;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (v_u, 'check-panel-don-' || v_u::text, 5000, 'aprobado', 'donacion');

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (v_u, 'check-panel-bad-' || v_u::text, 1000, 'rechazado', 'promocion');

  insert into promociones (paleta_id, origen, pago_id, hasta)
  values (v_promo, 'individual', v_pag, now() + interval '15 days');

  -- ---------------------------------------------------------------- resumen
  v_r := panel_resumen('mes');

  assert jsonb_array_length(panel_resumen('dia')   -> 'serie') = 30,
    'el rango diario tendria que traer 30 dias';
  assert jsonb_array_length(panel_resumen('anio')  -> 'serie') = 5,
    'el rango anual tendria que traer 5 anios';
  assert jsonb_array_length(v_r -> 'serie') = 12,
    'el rango mensual tendria que traer 12 meses';

  assert (v_r ->> 'comparable')::boolean,
    'el rango mensual si se puede comparar contra el anterior';
  assert not (panel_resumen('total') ->> 'comparable')::boolean,
    'el rango total no se compara contra nada';
  assert (panel_resumen('total') -> 'anterior') = 'null'::jsonb,
    'sin ventana anterior, anterior tiene que venir null y no en cero';

  -- Los baneados se fueron a proposito: no es un indicador que sirva.
  assert not (v_r -> 'totales') ? 'baneados',
    'el resumen no tendria que exponer baneados';

  assert (v_r #>> '{periodo,paletas}')::int
         = (v_antes #>> '{periodo,paletas}')::int + 3,
    'el periodo no refleja las tres paletas nuevas';
  assert (v_r #>> '{periodo,ingresos}')::bigint
         = (v_antes #>> '{periodo,ingresos}')::bigint + 7000,
    'el periodo no refleja los dos pagos aprobados';
  assert (v_r #>> '{periodo,promociones}')::int
         = (v_antes #>> '{periodo,promociones}')::int + 1,
    'el periodo no refleja la promocion nueva';

  -- La vencida NO cuenta como activa aunque la columna diga 'activa'.
  -- Se insertaron tres activas pero una esta vencida: tienen que sumar dos.
  assert (v_r #>> '{totales,activas}')::int
         = (v_antes #>> '{totales,activas}')::int + 2,
    'una publicacion vencida no tendria que contar como activa';
  assert (v_r #>> '{totales,vencidas}')::int
         = (v_antes #>> '{totales,vencidas}')::int + 1,
    'la vencida tendria que aparecer en vencidas';

  -- ---------------------------------------------------------------- atencion
  assert (v_r #>> '{atencion,vencen_pronto}')::int
         = (v_antes #>> '{atencion,vencen_pronto}')::int + 1,
    'la que vence en 3 dias tendria que estar en vencen_pronto';
  assert (v_r #>> '{atencion,ya_vencidas}')::int
         = (v_antes #>> '{atencion,ya_vencidas}')::int + 1,
    'la vencida tendria que estar en ya_vencidas';
  -- Hay DOS paletas sin foto, pero una esta vencida: tiene que sumar una sola.
  assert (v_r #>> '{atencion,sin_foto}')::int
         = (v_antes #>> '{atencion,sin_foto}')::int + 1,
    'sin_foto solo mira las activas vigentes: la vencida no cuenta';
  assert (v_r #>> '{atencion,pagos_problema}')::int
         = (v_antes #>> '{atencion,pagos_problema}')::int + 1,
    'el pago rechazado tendria que aparecer en pagos_problema';

  -- ---------------------------------------------------------------- dinero
  v_d := panel_dinero('mes');

  assert (v_d #>> '{bruto,periodo}')::bigint >= 7000,
    'el bruto del periodo no refleja los pagos aprobados';
  assert (v_d #>> '{por_concepto,donacion}')::bigint >= 5000,
    'la donacion tendria que salir separada del resto';
  assert (v_d -> 'por_concepto') ? 'suscripcion',
    'los tres conceptos tienen que estar presentes aunque den 0';
  assert (v_d #>> '{por_estado,rechazado}')::int >= 1,
    'el pago rechazado tendria que contarse por estado';
  -- 3 de 4 en este bloque, pero puede haber pagos previos: lo que se chequea
  -- es que sea un porcentaje valido y no una division por cero.
  assert (v_d ->> 'tasa_aprobacion')::int between 0 and 100,
    'la tasa de aprobacion tendria que ser un porcentaje';
  assert (v_d ->> 'ticket')::bigint > 0,
    'el ticket promedio tendria que salir de los aprobados';
  assert (v_d #>> '{tipos,individual}')::int >= 1,
    'no conto la promocion individual';
  assert (v_d #>> '{duraciones,d15}')::int >= 1,
    'una promocion de 15 dias tendria que caer en d15';
  assert jsonb_typeof(v_d -> 'ultimos') = 'array',
    'ultimos tendria que ser una lista';
  assert (v_d #>> '{suscripciones,creditos_totales}')::int
         = 3 * (v_d #>> '{suscripciones,vigentes}')::int,
    'son 3 creditos por suscripcion vigente';

  -- ---------------------------------------------------------------- catalogo
  v_c := panel_catalogo();

  assert (v_c #>> '{precio,promedio}')::bigint > 0,
    'el precio promedio tendria que salir';
  assert jsonb_array_length(v_c -> 'estado') = 10,
    'el histograma de estado tendria que traer los 10 valores, incluso en 0';
  assert (v_c #>> '{precios,b3}')::int >= 1,
    'la paleta de 250.000 tendria que caer en el bucket 200-300k';
  assert (v_c #>> '{precios,b1}')::int >= 1,
    'la paleta de 90.000 tendria que caer en el bucket <100k';
  assert (v_c #>> '{formas,diamante}')::int >= 1,
    'la Diamante tendria que contarse';
  assert jsonb_array_length(v_c -> 'provincias') >= 1,
    'tendria que haber al menos una provincia';
  -- Los rankings no publican la columna con la que se ordenan.
  assert not ((v_c -> 'marcas' -> 0) ? 'orden'),
    'el ranking no tendria que filtrar la clave de orden';
  assert (v_c -> 'marcas' -> 0) ? 'agrupadas',
    'cada fila del ranking dice cuantas quedaron plegadas (null si es real)';

  -- ------------------------------------------------------------------ gente
  v_g := panel_gente();

  assert (v_g #>> '{embudo,registrados}')::int >= 1,
    'el embudo no cuenta los registrados';
  assert (v_g #>> '{embudo,publicaron}')::int >= 1,
    'el que publico dos paletas tendria que contar en publicaron';
  assert (v_g ->> 'sin_publicar')::int
         = (v_g #>> '{embudo,registrados}')::int - (v_g #>> '{embudo,publicaron}')::int,
    'sin_publicar es el resto entre registrados y los que publicaron';
  -- Publico dos paletas y tiene que contar como UNA persona.
  assert (select count(*) from jsonb_array_elements(v_g -> 'top_vendedores') e
           where (e ->> 'id')::uuid = v_u and (e ->> 'paletas')::int = 3) = 1,
    'el vendedor tendria que aparecer una vez con sus tres paletas';

  -- ------------------------------------------------------------- permisos
  -- Lo que no puede pasar: que anon o authenticated lleguen a esto.
  assert not has_function_privilege('anon', 'public.panel_resumen(text)', 'execute'),
    'anon no puede ejecutar panel_resumen';
  assert not has_function_privilege('authenticated', 'public.panel_dinero(text)', 'execute'),
    'authenticated no puede ejecutar panel_dinero';
  assert not has_function_privilege('anon', 'public.panel_catalogo()', 'execute'),
    'anon no puede ejecutar panel_catalogo';
  assert not has_function_privilege('authenticated', 'public.panel_gente()', 'execute'),
    'authenticated no puede ejecutar panel_gente';
  assert has_function_privilege('service_role', 'public.panel_resumen(text)', 'execute'),
    'service_role tiene que poder ejecutar panel_resumen';

  -- La que se fue tiene que haberse ido de verdad.
  assert not exists (
    select 1 from pg_proc where proname = 'estadisticas_admin'
  ), 'estadisticas_admin tendria que estar borrada';

  -- Teardown en este orden por lo mismo que en 0008: borrar el usuario a secas
  -- dispara las dos cascadas a promociones a la vez y el check de origen
  -- explota.
  delete from promociones where paleta_id in (v_pal, v_venc, v_promo);
  delete from pagos where perfil_id = v_u;
  delete from auth.users where id = v_u;
end $checks$;
