-- marketpadel: esquema inicial
-- Publicaciones de paletas + suscripcion premium (3 creditos de promocion por
-- periodo, se consumen) + promocion individual paga por tiempo fijo.

-- ---------------------------------------------------------------- catalogos

create table marcas (
  id     smallint generated always as identity primary key,
  nombre text unique not null,
  activa boolean not null default true
);

insert into marcas (nombre) values
  ('Adidas'), ('Babolat'), ('Bullpadel'), ('Drop Shot'), ('Head'), ('Nox'),
  ('Royal Padel'), ('Siux'), ('StarVie'), ('Varlion'), ('Vibor-A'), ('Wilson');

-- ---------------------------------------------------------------- perfiles

create table perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  apellido   text not null,
  whatsapp   text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create function perfil_al_registrarse() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, apellido, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', ''),
    new.raw_user_meta_data ->> 'whatsapp'
  );
  return new;
end $$;

create trigger perfil_al_registrarse
  after insert on auth.users
  for each row execute function perfil_al_registrarse();

-- ---------------------------------------------------------------- paletas

create function tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table paletas (
  id                 uuid primary key default gen_random_uuid(),
  vendedor_id        uuid not null references perfiles (id) on delete cascade,
  marca_id           smallint not null references marcas (id) on delete restrict,
  modelo             text not null check (length(modelo) between 1 and 120),
  forma              text not null check (forma in ('Diamante', 'Lágrima', 'Redonda')),
  anio               int  not null check (anio between 2000 and 2100),
  estado             int  not null check (estado between 1 and 10),
  precio             int  not null check (precio > 0),
  provincia          text not null,
  ciudad             text not null,
  descripcion        text not null check (length(descripcion) <= 300),
  fotos              text[] not null default '{}' check (cardinality(fotos) <= 4),
  estado_publicacion text not null default 'activa'
                       check (estado_publicacion in ('activa', 'pausada', 'vendida', 'eliminada')),
  visitas            int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger paletas_updated_at
  before update on paletas
  for each row execute function tocar_updated_at();

create index paletas_feed_idx    on paletas (estado_publicacion, created_at desc);
create index paletas_vendedor_idx on paletas (vendedor_id);
create index paletas_marca_idx   on paletas (marca_id);
create index paletas_modelo_idx  on paletas
  using gin (to_tsvector('spanish'::regconfig, modelo));

-- ---------------------------------------------------------------- pagos

create table pagos (
  id                 uuid primary key default gen_random_uuid(),
  perfil_id          uuid not null references perfiles (id) on delete cascade,
  mp_payment_id      text unique not null, -- clave de idempotencia del webhook
  monto              int  not null check (monto > 0),
  estado             text not null check (estado in ('pendiente', 'aprobado', 'rechazado', 'devuelto')),
  concepto           text not null check (concepto in ('suscripcion', 'promocion')),
  external_reference text,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------- suscripciones

-- Una fila por periodo: renovar inserta una fila nueva. Los creditos usados son
-- un count(*) sobre promociones de esa fila, sin contador que sincronizar.
create table suscripciones (
  id                 uuid primary key default gen_random_uuid(),
  perfil_id          uuid not null references perfiles (id) on delete cascade,
  pago_id            uuid references pagos (id) on delete set null,
  desde              timestamptz not null default now(),
  hasta              timestamptz not null,
  mp_preapproval_id  text,
  check (hasta > desde)
);

create index suscripciones_vigentes_idx on suscripciones (perfil_id, hasta desc);

-- ---------------------------------------------------------------- promociones

create table promociones (
  id             uuid primary key default gen_random_uuid(),
  paleta_id      uuid not null references paletas (id) on delete cascade,
  origen         text not null check (origen in ('premium', 'individual')),
  suscripcion_id uuid references suscripciones (id) on delete cascade,
  pago_id        uuid references pagos (id) on delete set null,
  desde          timestamptz not null default now(),
  hasta          timestamptz not null,
  check ((origen = 'premium')    = (suscripcion_id is not null)),
  check ((origen = 'individual') = (pago_id is not null))
);

create index promociones_vigentes_idx on promociones (paleta_id, hasta desc);
create index promociones_suscripcion_idx on promociones (suscripcion_id);

-- Unico lugar donde vive el limite de 3 creditos.
create function promociones_validar() returns trigger
language plpgsql as $$
declare
  v_dueno  uuid;
  v_usados int;
begin
  select vendedor_id into v_dueno from paletas where id = new.paleta_id;

  if new.origen = 'premium' then
    -- ponytail: advisory lock en vez de tabla de creditos; serializa solo por
    -- suscripcion, evita que dos inserts simultaneos gasten el mismo credito.
    perform pg_advisory_xact_lock(hashtext(new.suscripcion_id::text));

    if not exists (
      select 1 from suscripciones s
       where s.id = new.suscripcion_id
         and s.perfil_id = v_dueno
         and now() between s.desde and s.hasta
    ) then
      raise exception 'suscripcion invalida, vencida o de otro usuario';
    end if;

    select count(*) into v_usados
      from promociones where suscripcion_id = new.suscripcion_id;

    if v_usados >= 3 then
      raise exception 'sin creditos';
    end if;
  end if;

  return new;
end $$;

create trigger promociones_validar
  before insert on promociones
  for each row execute function promociones_validar();

-- ---------------------------------------------------------------- lectura

create view paletas_publicas with (security_invoker = on) as
  select p.id, p.vendedor_id, p.marca_id, m.nombre as marca, p.modelo, p.forma,
         p.anio, p.estado, p.precio, p.provincia, p.ciudad, p.descripcion,
         p.fotos, p.visitas, p.created_at,
         exists (
           select 1 from promociones pr
            where pr.paleta_id = p.id and now() < pr.hasta
         ) as promocionada
    from paletas p
    join marcas m on m.id = p.marca_id
   where p.estado_publicacion = 'activa';

-- RLS bloquea el update anonimo, por eso la RPC.
create function incrementar_visitas(p_paleta_id uuid) returns void
language sql security definer set search_path = public as $$
  update paletas set visitas = visitas + 1
   where id = p_paleta_id and estado_publicacion = 'activa';
$$;

-- ---------------------------------------------------------------- RLS

alter table marcas        enable row level security;
alter table perfiles      enable row level security;
alter table paletas       enable row level security;
alter table pagos         enable row level security;
alter table suscripciones enable row level security;
alter table promociones   enable row level security;

create policy marcas_lectura on marcas
  for select using (true);

create policy perfiles_lectura on perfiles
  for select using (true);
create policy perfiles_propio on perfiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy paletas_lectura on paletas
  for select using (estado_publicacion = 'activa' or vendedor_id = auth.uid());
create policy paletas_alta on paletas
  for insert with check (vendedor_id = auth.uid());
create policy paletas_edicion on paletas
  for update using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());
create policy paletas_baja on paletas
  for delete using (vendedor_id = auth.uid());

create policy promociones_lectura on promociones
  for select using (true);
-- Las individuales las inserta el webhook con service role (bypasea RLS).
create policy promociones_premium on promociones
  for insert with check (
    origen = 'premium'
    and exists (select 1 from paletas p where p.id = paleta_id and p.vendedor_id = auth.uid())
  );

create policy suscripciones_propias on suscripciones
  for select using (perfil_id = auth.uid());

create policy pagos_propios on pagos
  for select using (perfil_id = auth.uid());

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public)
values ('paletas', 'paletas', true)
on conflict (id) do nothing;

create policy paletas_fotos_lectura on storage.objects
  for select using (bucket_id = 'paletas');
create policy paletas_fotos_alta on storage.objects
  for insert with check (
    bucket_id = 'paletas' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy paletas_fotos_baja on storage.objects
  for delete using (
    bucket_id = 'paletas' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------- checks
-- Corre en cada migracion. Si algo falla, la transaccion entera se revierte y
-- no queda nada creado. Los datos de prueba se borran al final.

do $checks$
declare
  u_a uuid := '00000000-0000-0000-0000-0000000000aa';
  u_b uuid := '00000000-0000-0000-0000-0000000000bb';
  sus uuid;
  pago uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; ajena uuid;
  ok boolean;
  n int;
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', u_a, 'authenticated', 'authenticated',
     'a@test.local', '', now(), now(), '{}', '{"nombre":"Ana","apellido":"Test"}'),
    ('00000000-0000-0000-0000-000000000000', u_b, 'authenticated', 'authenticated',
     'b@test.local', '', now(), now(), '{}', '{"nombre":"Beto","apellido":"Test"}');

  assert (select count(*) from perfiles where id in (u_a, u_b)) = 2,
    'el trigger no creo los perfiles';

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion)
  select u_a, m.id, x.modelo, 'Diamante', 2026, 9, 400000, 'Mendoza', 'Mendoza', 'test'
    from marcas m, (values ('t1'), ('t2'), ('t3'), ('t4')) as x(modelo)
   where m.nombre = 'Babolat';

  select id into p1 from paletas where vendedor_id = u_a and modelo = 't1';
  select id into p2 from paletas where vendedor_id = u_a and modelo = 't2';
  select id into p3 from paletas where vendedor_id = u_a and modelo = 't3';
  select id into p4 from paletas where vendedor_id = u_a and modelo = 't4';

  insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                       provincia, ciudad, descripcion)
  values (u_b, (select id from marcas where nombre = 'Nox'), 't5', 'Redonda',
          2026, 8, 300000, 'CABA', 'CABA', 'test')
  returning id into ajena;

  insert into suscripciones (perfil_id, hasta)
  values (u_a, now() + interval '30 days') returning id into sus;

  -- 1. tres creditos entran
  insert into promociones (paleta_id, origen, suscripcion_id, hasta)
  values (p1, 'premium', sus, now() + interval '30 days'),
         (p2, 'premium', sus, now() + interval '30 days'),
         (p3, 'premium', sus, now() + interval '30 days');

  -- 2. el cuarto no
  ok := false;
  begin
    insert into promociones (paleta_id, origen, suscripcion_id, hasta)
    values (p4, 'premium', sus, now() + interval '30 days');
  exception when others then ok := true;
  end;
  assert ok, 'el 4to credito premium tendria que fallar';

  -- 3. no se puede usar la suscripcion propia sobre una paleta ajena
  ok := false;
  begin
    insert into promociones (paleta_id, origen, suscripcion_id, hasta)
    values (ajena, 'premium', sus, now() + interval '30 days');
  exception when others then ok := true;
  end;
  assert ok, 'promocionar paleta ajena tendria que fallar';

  -- 4. una promocion vencida no cuenta como promocionada
  insert into pagos (perfil_id, mp_payment_id, monto, estado, concepto)
  values (u_a, 'test-mp-1', 5000, 'aprobado', 'promocion') returning id into pago;

  insert into promociones (paleta_id, origen, pago_id, hasta)
  values (p4, 'individual', pago, now() - interval '1 day');
  assert (select not promocionada from paletas_publicas where id = p4),
    'una promocion vencida no deberia contar';

  -- 5. la vista devuelve las promocionadas primero y trae el nombre de la marca
  select count(*) into n from (
    select promocionada from paletas_publicas
     where vendedor_id = u_a order by promocionada desc limit 3
  ) t where t.promocionada;
  assert n = 3, 'la vista no ordena las promocionadas primero';
  assert (select marca from paletas_publicas where id = p1) = 'Babolat',
    'la vista no resuelve el nombre de la marca';

  -- 6. marca inexistente
  ok := false;
  begin
    insert into paletas (vendedor_id, marca_id, modelo, forma, anio, estado, precio,
                         provincia, ciudad, descripcion)
    values (u_a, 999, 't6', 'Redonda', 2026, 8, 1000, 'CABA', 'CABA', 'test');
  exception when others then ok := true;
  end;
  assert ok, 'una marca_id inexistente tendria que fallar';

  delete from auth.users where id in (u_a, u_b);
end $checks$;
