import { test, expect } from "vitest";
import { ORDENES, ordenActual } from "./paletas";

// El feed abre de mas cara a mas barata. Es el unico orden que ademas pone las
// promocionadas primero (lib/paletas-db.ts compara contra ORDENES[0]), asi que
// si esto cambia de lugar, la promocion deja de servir para algo.
test("el orden por defecto es mayor precio", () => {
  expect(ORDENES[0]).toMatchObject({ valor: "precio-desc", columna: "precio", asc: false });
});

// El valor de la URL no llega crudo a la query: se resuelve contra la lista.
test("sin parametro o con basura, el orden es el default", () => {
  expect(ordenActual(undefined)).toBe(ORDENES[0]);
  expect(ordenActual("")).toBe(ORDENES[0]);
  expect(ordenActual("precio")).toBe(ORDENES[0]);
  expect(ordenActual("created_at; drop table paletas")).toBe(ORDENES[0]);
});

test("cada orden pedido se traduce a columna y sentido", () => {
  expect(ordenActual("recientes")).toMatchObject({ columna: "created_at", asc: false });
  expect(ordenActual("precio-asc")).toMatchObject({ columna: "precio", asc: true });
  expect(ordenActual("precio-desc")).toMatchObject({ columna: "precio", asc: false });
  expect(ordenActual("vistas")).toMatchObject({ columna: "visitas", asc: false });
});
