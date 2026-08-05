-- marketpadel: permitir publicar con una marca que no esta en el catalogo.
-- El input pasa a ser texto libre con sugerencias (datalist); esta funcion
-- resuelve el texto a un marca_id, creando la fila si no existia. Comparacion
-- sin importar mayusculas para no duplicar "Nox" y "NOX".

create unique index marcas_nombre_ci_idx on marcas (lower(nombre));

create function marca_id_para(p_nombre text) returns smallint
language plpgsql security definer set search_path = public as $$
declare
  v_id smallint;
  v_nombre text := trim(p_nombre);
begin
  if v_nombre = '' or length(v_nombre) > 60 then
    raise exception 'nombre de marca invalido';
  end if;

  insert into marcas (nombre) values (v_nombre)
  on conflict ((lower(nombre))) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from marcas where lower(nombre) = lower(v_nombre);
  end if;

  return v_id;
end $$;

-- ---------------------------------------------------------------- checks

do $checks$
declare
  v_id smallint;
  v_id2 smallint;
begin
  v_id := marca_id_para('  Adidas ');
  assert v_id = (select id from marcas where nombre = 'Adidas'),
    'una marca existente tendria que devolver el mismo id, sin duplicar';

  v_id := marca_id_para('Kelme');
  assert (select count(*) from marcas where lower(nombre) = 'kelme') = 1,
    'una marca nueva se tendria que crear una sola vez';

  v_id2 := marca_id_para('KELME');
  assert v_id = v_id2, 'buscarla con otra mayuscula/minuscula tendria que reusar la fila';

  begin
    perform marca_id_para('   ');
    assert false, 'un nombre vacio tendria que fallar';
  exception when others then null;
  end;

  delete from marcas where nombre = 'Kelme';
end $checks$;
