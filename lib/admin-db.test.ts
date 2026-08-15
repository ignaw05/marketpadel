import { test, expect } from "vitest";
import { rangoActual, RANGO_POR_DEFECTO, RANGOS } from "./admin-db";
import { etiquetaPeriodo } from "@/components/admin/grafico";

test("cada rango valido de la URL se respeta", () => {
  for (const r of RANGOS) expect(rangoActual(r)).toBe(r);
});

// La RPC levanta excepcion con un rango que no conoce, asi que este filtro es
// la unica cosa entre un ?rango= inventado y un 500 en el panel.
test("un rango inventado cae al default en vez de llegar a la base", () => {
  expect(rangoActual(undefined)).toBe(RANGO_POR_DEFECTO);
  expect(rangoActual("")).toBe(RANGO_POR_DEFECTO);
  expect(rangoActual("quincenal")).toBe(RANGO_POR_DEFECTO);
  expect(rangoActual("MES")).toBe(RANGO_POR_DEFECTO);
  expect(rangoActual("'; drop table paletas;--")).toBe(RANGO_POR_DEFECTO);
});

// La trampa: el bucket es una fecha pelada. Si se parsea en hora local, en
// cualquier huso al oeste de UTC el primero del mes se muestra como el ultimo
// del mes anterior.
test("el periodo se etiqueta en el dia que dice, en cualquier huso", () => {
  expect(etiquetaPeriodo("2026-08-01", "day")).toBe("1 ago");
  expect(etiquetaPeriodo("2026-01-01", "month")).toBe("ene 26");
  expect(etiquetaPeriodo("2026-01-01", "year")).toBe("2026");
  expect(etiquetaPeriodo("2026-08-10", "week")).toBe("sem. del 10 ago");
});
