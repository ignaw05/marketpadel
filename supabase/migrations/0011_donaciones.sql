-- Donacion opcional al marcar una publicacion como vendida.
--
-- Una donacion es otro concepto de pago, no otra tabla: `pagos` ya tiene
-- perfil_id, monto, estado, external_reference y mp_payment_id unique como
-- clave de idempotencia. Solo falta admitir el concepto.
alter table pagos drop constraint pagos_concepto_check;

alter table pagos add constraint pagos_concepto_check
  check (concepto in ('suscripcion', 'promocion', 'donacion'));
