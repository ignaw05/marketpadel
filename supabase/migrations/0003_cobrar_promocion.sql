-- Promocionar pasa a cobrarse con MercadoPago.

-- Desde el navegador ya no se promociona gratis. El origen 'cortesia' sigue
-- existiendo para regalar una promocion a mano, con service role.
drop policy promociones_cortesia on promociones;

-- Un pago compra una promocion y nada mas. Es la guarda real contra el evento
-- repetido de MP: pago_id es nullable y en Postgres un unique deja pasar todos
-- los null, asi que premium y cortesia no se ven afectados.
create unique index promociones_pago_idx on promociones (pago_id);

-- Todo lo que el webhook escribe, en una sola transaccion: o entra el pago con
-- su promocion, o no entra nada. Nadie paga sin recibir.
-- p_promocionar lo decide la app: si el monto cobrado no coincide con ningun plan,
-- el pago se guarda igual y con su estado real (la plata entro), pero no se
-- entrega nada hasta mirarlo a mano.
create function registrar_promocion_pagada(
  p_mp_payment_id text,
  p_paleta_id     uuid,
  p_dias          int,
  p_monto         int,
  p_estado        text,
  p_promocionar   boolean
) returns text
language plpgsql as $$
declare
  v_perfil uuid;
  v_pago   uuid;
  v_desde  timestamptz;
begin
  select vendedor_id into v_perfil from paletas where id = p_paleta_id;
  if v_perfil is null then return 'paleta_inexistente'; end if;

  -- MP manda 'pendiente' y despues 'aprobado' del mismo pago: el estado se pisa,
  -- no se descarta, si no la aprobacion nunca llegaria a promocionar.
  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto, external_reference)
  values (v_perfil, p_mp_payment_id, p_monto, p_estado, 'promocion',
          p_paleta_id::text || ':' || p_dias)
  on conflict (mp_payment_id) do update set estado = excluded.estado
  returning id into v_pago;

  if p_estado <> 'aprobado' then return 'no_aprobado'; end if;
  if not p_promocionar then return 'monto_inesperado'; end if;

  -- El mismo evento aprobado llega varias veces. El unique de arriba es la
  -- garantia; esto evita levantar una excepcion en el camino normal.
  if exists (select 1 from promociones where pago_id = v_pago) then return 'repetido'; end if;

  -- Si ya hay una promo corriendo, la nueva arranca cuando esa termina: pagar dos
  -- veces en la misma ventana suma dias en vez de superponerlos.
  select coalesce(max(hasta), now()) into v_desde
    from promociones where paleta_id = p_paleta_id and hasta > now();

  insert into promociones (paleta_id, origen, pago_id, desde, hasta)
  values (p_paleta_id, 'individual', v_pago, v_desde,
          v_desde + (p_dias || ' days')::interval);

  return 'promocionada';
end $$;

-- Sin esto cualquier usuario logueado podria llamarla y regalarse una promocion.
revoke execute on function registrar_promocion_pagada(text, uuid, int, int, text, boolean)
  from public, anon, authenticated;
grant execute on function registrar_promocion_pagada(text, uuid, int, int, text, boolean)
  to service_role;
