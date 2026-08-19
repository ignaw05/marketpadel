import { test, expect } from "vitest";
import { CLAVES_FILTRO, PERMUTA, type FiltrosFeed } from "./paletas";

// El feed decide entre "no encontramos paletas" y "todavia no hay nada
// publicado" con CLAVES_FILTRO. Si permuta no esta en la lista, filtrar por
// permuta y no encontrar nada muestra el vacio equivocado.
test("permuta cuenta como filtro puesto", () => {
  const puesto = (f: FiltrosFeed) => CLAVES_FILTRO.some((k) => f[k]);

  expect(puesto({})).toBe(false);
  expect(puesto({ permuta: "Sí" })).toBe(true);
  // `orden` y `pagina` no son filtros y no tienen que contar.
  expect(puesto({ orden: "precio-asc", pagina: "3" })).toBe(false);
});

// Los valores viajan crudos en la URL y listarPaletas los compara contra esta
// lista: si cambian aca sin cambiar la query, el chip deja de filtrar en
// silencio.
test("el catalogo de permuta es el que espera la query", () => {
  expect(PERMUTA).toEqual(["Sí", "No"]);
});
