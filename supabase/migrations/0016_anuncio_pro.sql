-- marketpadel: el perfil recuerda si ya vio el anuncio del plan Pro.
--
-- El anuncio se abre solo al entrar a la portada y se muestra UNA vez por
-- usuario. Por usuario y no por navegador: con localStorage volveria a
-- aparecer cada vez que el mismo vendedor entra desde otro telefono, que es
-- justo la gente que mas cambia de dispositivo.
--
-- No lleva fecha de "cuando lo vio": nadie va a preguntar eso, y si algun dia
-- hay que volver a mostrarlo (campaña nueva, precio nuevo), lo que corresponde
-- es un update masivo a false, no leer un timestamp.
--
-- Quien lo escribe es el propio usuario sobre su fila, con la policy
-- `perfiles_propio` de 0001. No hace falta policy nueva.

alter table perfiles
  add column vio_anuncio_pro boolean not null default false;

comment on column perfiles.vio_anuncio_pro is
  'true desde que se le abrio el anuncio del plan Pro en la portada. Al que ya '
  'es Pro no se le muestra aunque este en false.';
