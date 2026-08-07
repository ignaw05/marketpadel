import { test, expect } from "vitest";
import { paginaActual, POR_PAGINA } from "./paletas";

test("sin parametro o con basura, la pagina es la 1", () => {
  expect(paginaActual(undefined)).toBe(1);
  expect(paginaActual("")).toBe(1);
  expect(paginaActual("abc")).toBe(1);
  expect(paginaActual("1.5")).toBe(1);
});

test("una pagina valida se respeta", () => {
  expect(paginaActual("1")).toBe(1);
  expect(paginaActual("3")).toBe(3);
});

test("cero y negativos caen en la 1", () => {
  expect(paginaActual("0")).toBe(1);
  expect(paginaActual("-5")).toBe(1);
});

// La pagina se traduce en un OFFSET, asi que sin tope un ?pagina=99999999 le
// pide a Postgres descartar cien millones de filas para devolver cero.
test("el tope corta las paginas absurdas", () => {
  expect(paginaActual("99999999")).toBe(500);
  expect(paginaActual("2e3")).toBe(500);
});

test("el offset de la primera pagina es 0 y no se solapa con la segunda", () => {
  const offset = (p: number) => (paginaActual(String(p)) - 1) * POR_PAGINA;
  expect(offset(1)).toBe(0);
  expect(offset(2)).toBe(POR_PAGINA);
  expect(offset(3)).toBe(POR_PAGINA * 2);
});
