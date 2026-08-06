-- marketpadel: las publicaciones vencen a los 30 dias y hay que renovarlas.
--
-- Sin job y sin estado nuevo. La vista paletas_publicas ya filtraba por
-- estado_publicacion; ahora tambien por fecha, asi que una publicacion sale del
-- feed en el instante exacto en que vence, sin que corra nada. La busqueda no se
-- carga con avisos viejos, que era el punto.
--
-- ponytail: no se borra nada. Lo unico que ocupa lugar de verdad son las fotos
-- del bucket, y borrarlas necesita service role (un delete sobre storage.objects
-- desde SQL deja el archivo huerfano). Si el disco duele, el upgrade es un cron
-- diario que le pegue a una route con service role.

alter table paletas
  add column vence_at timestamptz not null default now() + interval '30 days';

-- Las que ya estaban publicadas arrancan los 30 dias desde hoy, no desde que se
-- publicaron: nadie tendria que perder su aviso por un deploy.
update paletas set vence_at = now() + interval '30 days';

-- El feed ordena por promocionada y created_at, pero ahora descarta por vence_at
-- antes de ordenar. ponytail: sin indice nuevo, con este volumen el filtro se
-- resuelve sobre el mismo scan. Si el catalogo crece, (estado_publicacion, vence_at).
create or replace view paletas_publicas with (security_invoker = on) as
  select p.id, p.vendedor_id, p.marca_id, m.nombre as marca, p.modelo, p.forma,
         p.anio, p.estado, p.precio, p.provincia, p.ciudad, p.descripcion,
         p.fotos, p.visitas, p.created_at,
         exists (
           select 1 from promociones pr
            where pr.paleta_id = p.id and now() < pr.hasta
         ) as promocionada
    from paletas p
    join marcas m on m.id = p.marca_id
   where p.estado_publicacion = 'activa'
     and now() < p.vence_at;

-- ---------------------------------------------------------- promo renueva

-- Promocionar renueva la publicacion. Sin esto se podria pagar una promo de 30
-- dias sobre un aviso al que le quedan 3: se apagaria en el medio, ya cobrado.
--
-- `greatest` para que nunca acorte: al que le quedan 40 dias no le baja a 30. Y
-- `new.hasta` porque si algun dia se vende un plan mas largo que DURACION_DIAS,
-- la promo tiene que llegar entera igual.
--
-- Va como trigger y no dentro de registrar_promocion_pagada porque hay tres
-- caminos que insertan promociones (individual pagada, premium, cortesia) y los
-- tres tendrian que renovar.
--
-- security definer: la premium la inserta el usuario con su JWT y la RLS de
-- paletas dejaria pasar el update igual, pero una fila que no matchea se saltea
-- sin error. Preferimos que renueve siempre a que falle en silencio.
create function promociones_renovar_paleta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update paletas
     set vence_at = greatest(vence_at, now() + interval '30 days', new.hasta)
   where id = new.paleta_id;
  return new;
end $$;

create trigger promociones_renovar_paleta
  after insert on promociones
  for each row execute function promociones_renovar_paleta();

-- ---------------------------------------------------------------- checks

do $checks$
declare
  u_a  uuid := gen_random_uuid();
  marca smallint;
  p_ok uuid;
  p_venc uuid;
  v_pago uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-vencimiento@example.com',
          '{"nombre":"Check","apellido":"Vencimiento"}'::jsonb);

  select id into marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion)
  values (u_a, marca, 'vigente', 'Redonda', 2026, 8, 1000, 'CABA', 'CABA', 'test')
  returning id into p_ok;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion, vence_at)
  values (u_a, marca, 'vencida', 'Redonda', 2026, 8, 1000, 'CABA', 'CABA', 'test',
          now() - interval '1 minute')
  returning id into p_venc;

  assert exists (select 1 from paletas_publicas where id = p_ok),
    'una publicacion dentro de los 30 dias tendria que estar en el feed';

  assert not exists (select 1 from paletas_publicas where id = p_venc),
    'una publicacion vencida no tendria que aparecer en el feed';

  -- Renovar la saca del vencimiento sin tocar ninguna otra columna.
  update paletas set vence_at = now() + interval '30 days' where id = p_venc;
  assert exists (select 1 from paletas_publicas where id = p_venc),
    'renovar tendria que devolverla al feed';

  -- El default cubre a la que se publica ahora.
  assert (select vence_at from paletas where id = p_ok) > now() + interval '29 days',
    'una publicacion nueva tendria que nacer con 30 dias';

  -- Promocionar una a la que le quedaban 3 dias la lleva a 30.
  update paletas set vence_at = now() + interval '3 days' where id = p_venc;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-vencimiento-1', 3000, 'aprobado', 'promocion')
  returning id into v_pago;

  insert into promociones (paleta_id, origen, pago_id, hasta)
  values (p_venc, 'individual', v_pago, now() + interval '15 days');

  assert (select vence_at from paletas where id = p_venc) > now() + interval '29 days',
    'promocionar tendria que renovar la publicacion a 30 dias';

  -- Y a la que le sobraban dias no se los acorta.
  update paletas set vence_at = now() + interval '90 days' where id = p_ok;

  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'check-vencimiento-2', 3000, 'aprobado', 'promocion')
  returning id into v_pago;

  insert into promociones (paleta_id, origen, pago_id, hasta)
  values (p_ok, 'individual', v_pago, now() + interval '30 days');

  assert (select vence_at from paletas where id = p_ok) > now() + interval '89 days',
    'promocionar no tendria que acortar un vencimiento mas lejano';

  delete from auth.users where id = u_a;
end $checks$;
