-- Promocion sin cobrar, hasta que MercadoPago este conectado.
--
-- ponytail: tercer origen en vez de aflojar los checks de pago. Asi
-- `(origen = 'individual') = (pago_id is not null)` y su par de suscripcion
-- siguen intactos para el flujo real: con origen 'cortesia' los dos lados dan
-- false y pasan. Cuando el webhook inserte con origen 'individual', se borra
-- este archivo entero (el origen y la policy) en una migracion de vuelta.

alter table promociones drop constraint promociones_origen_check;
alter table promociones add constraint promociones_origen_check
  check (origen in ('premium', 'individual', 'cortesia'));

-- El dueño de una paleta se la promociona solo, gratis.
create policy promociones_cortesia on promociones
  for insert with check (
    origen = 'cortesia'
    and exists (
      select 1 from paletas p where p.id = paleta_id and p.vendedor_id = auth.uid()
    )
  );
