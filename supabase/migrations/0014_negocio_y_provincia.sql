-- marketpadel: el perfil gana nombre de negocio y provincia.
--
-- El vendedor Pro normalmente vende a nombre propio, pero puede tener un local:
-- ahi lo que el comprador reconoce es la marca, no la persona. `negocio` es
-- opcional y, cuando esta, es lo que sale en la cinta del feed y en la cartelera.
--
-- `provincia` es del vendedor, no de la publicacion: `paletas.provincia` sigue
-- siendo donde esta esa paleta. La del perfil es la que muestra la cartelera sin
-- tener que deducirla de lo que tenga publicado.

alter table perfiles add column negocio   text check (length(negocio) <= 60);
alter table perfiles add column provincia text check (length(provincia) <= 60);

comment on column perfiles.negocio is
  'Nombre del local, opcional. Si esta, reemplaza al nombre de la persona en '
  'las superficies publicas (cinta del feed, cartelera de /vendedores).';

-- ------------------------------------------------------- alta desde el registro
-- Los dos datos viajan en options.data del signUp, igual que nombre y whatsapp.
-- `create or replace` sobre la funcion de 0001: el trigger queda como esta y
-- pasa a ejecutar esta version.
create or replace function perfil_al_registrarse() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, apellido, whatsapp, negocio, provincia)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', ''),
    new.raw_user_meta_data ->> 'whatsapp',
    -- nullif: un campo vacio del form tiene que quedar null, no '', si no
    -- `negocio` vacio ganaria la carrera del coalesce en la vista.
    nullif(trim(new.raw_user_meta_data ->> 'negocio'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'provincia'), '')
  );
  return new;
end $$;

-- ---------------------------------------------------------------- la vista
-- Solo cambia la expresion de vendedor_pro: el negocio manda sobre el nombre.
-- No se agregan columnas, asi que el `create or replace` no tiene el problema
-- de orden que documenta 0012.
--
-- Igual que en 0013, la expresion de `promocionada` depende de si 0006 esta
-- aplicada y hay que detectarlo en vez de pisarla.
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
  execute format($sql$
    create or replace view paletas_publicas with (security_invoker = on) as
      select p.id, p.vendedor_id, p.marca_id, m.nombre as marca, p.modelo,
             p.forma, p.anio, p.estado, p.precio, p.provincia, p.ciudad,
             p.descripcion, p.fotos, p.visitas, p.created_at,
             %s as promocionada,
             p.acepta_permuta,
             case when pf.pro_hasta > now()
                  then coalesce(
                         nullif(trim(pf.negocio), ''),
                         nullif(trim(pf.nombre || ' ' || pf.apellido), ''),
                         'Vendedor Pro'
                       )
             end as vendedor_pro
        from paletas p
        join marcas m on m.id = p.marca_id
        join perfiles pf on pf.id = p.vendedor_id
       where p.estado_publicacion = 'activa'
         and now() < p.vence_at
  $sql$, promocionada);
end $vista$;

-- La cartelera necesita los dos datos: el negocio para el titulo y la provincia
-- para no tener que deducirla de la primera paleta que tenga publicada.
create or replace view vendedores_pro with (security_invoker = on) as
  select p.id, p.nombre, p.apellido, p.avatar_url, p.created_at,
         p.negocio, p.provincia
    from perfiles p
   where p.pro_hasta > now();

-- ---------------------------------------------------------------- checks

do $checks$
declare
  u_a     uuid := gen_random_uuid();
  u_b     uuid := gen_random_uuid();
  v_marca smallint;
  pal_a   uuid;
  pal_b   uuid;
  ok      boolean;
begin
  -- 1. el trigger baja negocio y provincia del registro
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_a, 'check-negocio@example.com',
          '{"nombre":"Ana","apellido":"Local","whatsapp":"+5491155550000",
            "negocio":"Padel Store Check","provincia":"Córdoba"}'::jsonb);

  assert (select negocio from perfiles where id = u_a) = 'Padel Store Check',
    'el trigger no bajo el negocio del registro';
  assert (select provincia from perfiles where id = u_a) = 'Córdoba',
    'el trigger no bajo la provincia del registro';

  -- 2. sin negocio queda null, no cadena vacia: '' le ganaria al nombre en el
  --    coalesce de la vista y la cinta saldria en blanco.
  insert into auth.users (id, email, raw_user_meta_data)
  values (u_b, 'check-sin-negocio@example.com',
          '{"nombre":"Beto","apellido":"Persona","negocio":"  ","provincia":""}'::jsonb);

  assert (select negocio is null from perfiles where id = u_b),
    'un negocio en blanco tendria que quedar en null';
  assert (select provincia is null from perfiles where id = u_b),
    'una provincia vacia tendria que quedar en null';

  select id into v_marca from marcas limit 1;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_a, v_marca, 'Check Negocio', 'Diamante', 2026, 9, 300000,
          'CABA', 'CABA', 'test')
  returning id into pal_a;

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado,
                       precio, provincia, ciudad, descripcion)
  values (u_b, v_marca, 'Check Persona', 'Redonda', 2026, 8, 200000,
          'CABA', 'CABA', 'test')
  returning id into pal_b;

  -- 3. sin plan Pro no hay cinta, tenga negocio o no
  assert (select vendedor_pro is null from paletas_publicas where id = pal_a),
    'un vendedor sin plan no puede traer vendedor_pro aunque tenga negocio';

  -- 4. con plan, el negocio le gana al nombre de la persona
  insert into suscripciones (perfil_id, hasta) values (u_a, now() + interval '30 days');
  insert into suscripciones (perfil_id, hasta) values (u_b, now() + interval '30 days');

  assert (select vendedor_pro from paletas_publicas where id = pal_a) = 'Padel Store Check',
    'con negocio cargado, la cinta tendria que mostrar el negocio';

  -- 5. y sin negocio, cae al nombre y apellido
  assert (select vendedor_pro from paletas_publicas where id = pal_b) = 'Beto Persona',
    'sin negocio, la cinta tendria que mostrar el nombre de la persona';

  -- 6. la cartelera ve los dos datos nuevos
  assert (select negocio from vendedores_pro where id = u_a) = 'Padel Store Check',
    'vendedores_pro tendria que exponer el negocio';
  assert (select provincia from vendedores_pro where id = u_a) = 'Córdoba',
    'vendedores_pro tendria que exponer la provincia';

  -- 7. el largo esta acotado: el negocio entra en una cinta de 11px
  ok := false;
  begin
    update perfiles set negocio = repeat('x', 61) where id = u_a;
  exception when others then ok := true;
  end;
  assert ok, 'un negocio de mas de 60 caracteres tendria que fallar';

  delete from auth.users where id in (u_a, u_b);
end $checks$;
