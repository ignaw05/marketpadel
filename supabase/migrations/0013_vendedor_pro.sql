-- marketpadel: Vendedor Pro, la suscripcion mensual.
--
-- La mitad de esto ya estaba en 0001_init.sql y nunca se uso: la tabla
-- `suscripciones`, el origen 'premium' de `promociones`, el trigger que corta en
-- 3 creditos por periodo y la policy que deja al vendedor autopromocionarse con
-- su suscripcion. Esta migracion NO los toca. Agrega lo que faltaba para que el
-- plan sea visible y cobrable:
--
--   1. perfiles.pro_hasta, materializada, para no repetir la subconsulta en
--      cada pantalla que pregunta "este es Pro?".
--   2. paletas_publicas.vendedor_pro, el nombre del vendedor cuando tiene el
--      plan vigente. Es lo que dibuja la cinta arriba de la foto en el feed.
--   3. vendedores_pro, la lista de la seccion /vendedores.
--   4. registrar_suscripcion_pagada, el equivalente de
--      registrar_promocion_pagada (0003) para el webhook de MercadoPago.
--
-- Los creditos NO se acumulan y eso sale gratis del modelo de 0001: se cuentan
-- por fila de `suscripciones`, y renovar inserta una fila nueva.

-- ---------------------------------------------------------------- pro_hasta

alter table perfiles add column pro_hasta timestamptz;

comment on column perfiles.pro_hasta is
  'Vencimiento de la suscripcion Pro mas lejana de este perfil. Lo mantiene el '
  'trigger suscripciones_tocar_perfil; no escribir a mano.';

-- Mismo patron que promociones_tocar_paleta (0006_performance.sql): recalcular
-- con max() en vez de acumular, asi un update o un delete tambien quedan bien.
--
-- security definer por el mismo motivo que promociones_renovar_paleta (0005):
-- la RLS de `perfiles` solo deja actualizar la fila propia, y un update que no
-- matchea no falla, se saltea en silencio. Preferimos que escriba siempre.
create function suscripciones_tocar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update perfiles p
     set pro_hasta = (
       select max(hasta) from suscripciones where perfil_id = p.id
     )
   where p.id = coalesce(new.perfil_id, old.perfil_id);
  return null;
end $$;

create trigger suscripciones_tocar_perfil
  after insert or update or delete on suscripciones
  for each row execute function suscripciones_tocar_perfil();

-- Backfill: hoy no hay ninguna, pero la migracion tiene que dar lo mismo contra
-- una base con datos que contra una vacia.
update perfiles p
   set pro_hasta = (select max(hasta) from suscripciones where perfil_id = p.id)
 where exists (select 1 from suscripciones where perfil_id = p.id);

-- ---------------------------------------------------------------- la vista
-- Dos restricciones que ya documento 0012_sponsors_y_permuta.sql y que siguen
-- valiendo:
--
-- 1. `create or replace view` solo admite AGREGAR columnas AL FINAL. Por eso
--    vendedor_pro va despues de acepta_permuta.
--
-- 2. La expresion de `promocionada` depende de si 0006_performance.sql esta
--    aplicada. En produccion, hoy, NO lo esta; en una base nueva `supabase db
--    push` la aplica. Se detecta y se conserva la que corresponda.
--
-- Por que el nombre y no un booleano `es_pro`: la unica UI que lo consume es la
-- cinta, y la cinta muestra el nombre. Una columna que es "el nombre si es Pro,
-- null si no" alcanza para las dos preguntas y evita traer dos columnas para
-- dibujar una sola cosa.
--
-- El join a perfiles no filtra nada nuevo: `perfiles_lectura` es `using (true)`
-- desde 0001, o sea que nombre y apellido ya eran publicos.
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
             p.acepta_permuta,
             -- coalesce al final: un Pro sin nombre cargado igual tiene que
             -- llevar cinta, si no pagaria por algo que no se ve.
             case when pf.pro_hasta > now()
                  then coalesce(nullif(trim(pf.nombre || ' ' || pf.apellido), ''),
                                'Vendedor Pro')
             end as vendedor_pro
        from paletas p
        join marcas m on m.id = p.marca_id
        join perfiles pf on pf.id = p.vendedor_id
       where p.estado_publicacion = 'activa'
         and now() < p.vence_at
  $sql$, promocionada);
end $vista$;

-- ------------------------------------------------------------ vendedores_pro
-- La seccion /vendedores: un vendedor por fila, sus paletas se piden aparte con
-- un `in (...)` sobre paletas_publicas.
--
-- El orden lo pone la app por created_at (antiguedad en Paletita) y no por la
-- fecha de alta de la suscripcion, que seria lo obvio: `suscripciones` tiene RLS
-- de "solo las propias", asi que con security_invoker un visitante anonimo no
-- veria ninguna y el orden saldria todo null.
--
-- ponytail: orden fijo en vez de rotacion diaria, que romperia el cache de Next
-- todos los dias. Si algun dia hay tantos Pro como para que el orden sea una
-- queja, ahi entra.
create view vendedores_pro with (security_invoker = on) as
  select p.id, p.nombre, p.apellido, p.avatar_url, p.created_at
    from perfiles p
   where p.pro_hasta > now();

-- ---------------------------------------------------------------- el cobro

-- Un pago compra un periodo y nada mas. Misma guarda que promociones_pago_idx
-- (0003): pago_id es nullable y un unique de Postgres deja pasar todos los null,
-- asi que las suscripciones dadas de alta a mano no se ven afectadas.
create unique index suscripciones_pago_idx on suscripciones (pago_id);

-- Calcado de registrar_promocion_pagada (0003_cobrar_promocion.sql): todo lo que
-- el webhook escribe, en una sola transaccion. O entra el pago con su periodo, o
-- no entra nada.
--
-- p_activar lo decide la app comparando contra el precio del plan: si el monto
-- cobrado no coincide, el pago se guarda igual con su estado real (la plata
-- entro) pero no se entrega nada hasta mirarlo a mano.
create function registrar_suscripcion_pagada(
  p_mp_payment_id text,
  p_perfil_id     uuid,
  p_monto         int,
  p_estado        text,
  p_activar       boolean
) returns text
language plpgsql as $$
declare
  v_pago  uuid;
  v_desde timestamptz;
begin
  if not exists (select 1 from perfiles where id = p_perfil_id) then
    return 'perfil_inexistente';
  end if;

  -- MP manda 'pendiente' y despues 'aprobado' del mismo pago: el estado se pisa,
  -- no se descarta, si no la aprobacion nunca llegaria a activar.
  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto, external_reference)
  values (p_perfil_id, p_mp_payment_id, p_monto, p_estado, 'suscripcion',
          'pro:' || p_perfil_id::text)
  on conflict (mp_payment_id) do update set estado = excluded.estado
  returning id into v_pago;

  if p_estado <> 'aprobado' then return 'no_aprobado'; end if;
  if not p_activar then return 'monto_inesperado'; end if;

  -- El mismo evento aprobado llega varias veces. El unique de arriba es la
  -- garantia; esto evita levantar una excepcion en el camino normal.
  if exists (select 1 from suscripciones where pago_id = v_pago) then
    return 'repetido';
  end if;

  -- Renovar antes de que venza encadena en vez de superponer: el periodo nuevo
  -- arranca cuando termina el que esta corriendo.
  --
  -- Esto resuelve solo el abuso de creditos. El trigger promociones_validar
  -- (0001) exige `now() between s.desde and s.hasta`, asi que la fila futura no
  -- entrega sus 3 creditos hasta que arranca: pagar seis meses de golpe no da
  -- dieciocho promociones para hoy.
  select coalesce(max(hasta), now()) into v_desde
    from suscripciones where perfil_id = p_perfil_id and hasta > now();

  insert into suscripciones (perfil_id, pago_id, desde, hasta)
  values (p_perfil_id, v_pago, v_desde, v_desde + interval '30 days');

  return 'activada';
end $$;

-- Sin esto cualquier usuario logueado podria llamarla y regalarse el plan.
revoke execute on function registrar_suscripcion_pagada(text, uuid, int, text, boolean)
  from public, anon, authenticated;
grant execute on function registrar_suscripcion_pagada(text, uuid, int, text, boolean)
  to service_role;

-- ---------------------------------------------------------------- checks

do $checks$
declare
  u_a   uuid := gen_random_uuid();
  u_b   uuid := gen_random_uuid();
  -- v_marca y no `marca`: la vista expone una columna con ese nombre, y adentro
  -- de PL/pgSQL una variable que se llama igual que una columna hace que la
  -- referencia sea ambigua y el assert falle.
  v_marca smallint;
  pal   uuid;
  pal_b uuid;
  sus   uuid;
  sus2  uuid;
  r     text;
  ok    boolean;
  n     int;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-pro-a@example.com',
          '{"nombre":"Check","apellido":"Pro"}'::jsonb),
         (u_b, 'check-pro-b@example.com',
          '{"nombre":"Check","apellido":"Comun"}'::jsonb);

  select id into v_marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, v_marca, 'Check Pro', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_b, v_marca, 'Check Comun', 'Redonda', 2026, 8, 200000,
          'CABA', 'CABA', 'test')
  returning id into pal_b;

  -- 1. sin suscripcion no hay nada de Pro
  assert (select pro_hasta is null from perfiles where id = u_a),
    'pro_hasta tendria que arrancar en null';
  assert (select vendedor_pro is null from paletas_publicas where id = pal),
    'una paleta de un vendedor sin plan no puede traer vendedor_pro';
  assert not exists (select 1 from vendedores_pro where id = u_a),
    'un perfil sin plan no tendria que estar en vendedores_pro';

  -- 2. el trigger materializa pro_hasta y la vista muestra el nombre
  insert into suscripciones (perfil_id, hasta)
  values (u_a, now() + interval '30 days') returning id into sus;

  assert (select pro_hasta is not null from perfiles where id = u_a),
    'el trigger no materializo pro_hasta';
  assert (select vendedor_pro from paletas_publicas where id = pal) = 'Check Pro',
    'la vista no expone el nombre del vendedor Pro';
  assert exists (select 1 from vendedores_pro where id = u_a),
    'un perfil con plan vigente tendria que estar en vendedores_pro';

  -- 3. el vendedor comun sigue sin cinta: la cinta separa, no decora
  assert (select vendedor_pro is null from paletas_publicas where id = pal_b),
    'un vendedor sin plan no puede traer vendedor_pro';

  -- 4. los 3 creditos siguen siendo 3 (el trigger de 0001 no se toco)
  insert into promociones (paleta_id, origen, suscripcion_id, hasta)
  values (pal, 'premium', sus, now() + interval '15 days');

  assert (select promocionada from paletas_publicas where id = pal),
    'usar un credito tendria que promocionar la paleta';

  -- 5. renovar antes de vencer encadena, no superpone
  select registrar_suscripcion_pagada('check-pro-mp-1', u_a, 10000, 'aprobado', true)
    into r;
  assert r = 'activada', 'el pago del plan tendria que activar un periodo: ' || r;

  select count(*) into n from suscripciones where perfil_id = u_a;
  assert n = 2, 'renovar tendria que insertar una fila nueva, no pisar la vieja';

  select id into sus2 from suscripciones
   where perfil_id = u_a and pago_id is not null;

  assert (select desde from suscripciones where id = sus2)
       >= (select hasta from suscripciones where id = sus) - interval '1 second',
    'el periodo nuevo tendria que arrancar cuando termina el anterior';

  -- 6. y el periodo que todavia no arranco no entrega sus creditos
  ok := false;
  begin
    insert into promociones (paleta_id, origen, suscripcion_id, hasta)
    values (pal, 'premium', sus2, now() + interval '15 days');
  exception when others then ok := true;
  end;
  assert ok, 'una suscripcion que arranca en el futuro no puede dar creditos';

  -- 7. el mismo pago dos veces no compra dos periodos
  select registrar_suscripcion_pagada('check-pro-mp-1', u_a, 10000, 'aprobado', true)
    into r;
  assert r = 'repetido', 'el evento repetido de MP no puede activar de nuevo: ' || r;

  select count(*) into n from suscripciones where perfil_id = u_a;
  assert n = 2, 'el evento repetido de MP duplico el periodo';

  -- 8. un monto que no es el del plan entra como pago pero no activa nada
  select registrar_suscripcion_pagada('check-pro-mp-2', u_b, 50, 'aprobado', false)
    into r;
  assert r = 'monto_inesperado', 'un monto raro no tendria que activar: ' || r;
  assert exists (select 1 from pagos where mp_payment_id = 'check-pro-mp-2'),
    'el pago con monto raro tiene que quedar registrado igual';
  assert not exists (select 1 from suscripciones where perfil_id = u_b),
    'un monto raro no puede dejar una suscripcion';

  -- 9. al vencer el plan se apaga la cinta, pero la promocion ya canjeada sigue
  update suscripciones set desde = now() - interval '60 days',
                           hasta = now() - interval '1 day'
   where perfil_id = u_a;

  assert (select vendedor_pro is null from paletas_publicas where id = pal),
    'con el plan vencido no tendria que quedar cinta';
  assert not exists (select 1 from vendedores_pro where id = u_a),
    'un perfil con el plan vencido no tendria que estar en vendedores_pro';
  assert (select promocionada from paletas_publicas where id = pal),
    'la promocion ya canjeada tiene que seguir corriendo hasta cumplir sus dias';

  -- 10. la vista no perdio nada de lo que ya exponia
  assert (select marca from paletas_publicas where id = pal) is not null,
    'la vista no resuelve el nombre de la marca';
  assert (select acepta_permuta is not null from paletas_publicas where id = pal),
    'la vista tendria que seguir exponiendo acepta_permuta';
  assert (select promocionada is not null from paletas_publicas where id = pal_b),
    'promocionada no puede ser null: order by promocionada desc pone los null primero';

  delete from auth.users where id in (u_a, u_b);
end $checks$;
