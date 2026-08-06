import { test, expect } from "vitest";
import { diasParaVencer, puedeRenovar, vencida, RENOVAR_DESDE_DIAS } from "./paletas";

const AHORA = new Date("2026-08-06T12:00:00Z");
const enDias = (d: number) =>
  new Date(AHORA.getTime() + d * 86400000).toISOString();

test("una publicacion recien hecha no esta vencida ni se puede renovar", () => {
  const p = { vence_at: enDias(30) };
  expect(vencida(p, AHORA)).toBe(false);
  expect(puedeRenovar(p, AHORA)).toBe(false);
  expect(diasParaVencer(p.vence_at, AHORA)).toBe(30);
});

test("se puede renovar recien en la ventana final", () => {
  expect(puedeRenovar({ vence_at: enDias(RENOVAR_DESDE_DIAS + 1) }, AHORA)).toBe(false);
  expect(puedeRenovar({ vence_at: enDias(RENOVAR_DESDE_DIAS) }, AHORA)).toBe(true);
  expect(puedeRenovar({ vence_at: enDias(1) }, AHORA)).toBe(true);
});

test("una vencida sigue siendo renovable", () => {
  const p = { vence_at: enDias(-3) };
  expect(vencida(p, AHORA)).toBe(true);
  expect(puedeRenovar(p, AHORA)).toBe(true);
});

test("justo en el limite ya esta vencida", () => {
  expect(vencida({ vence_at: AHORA.toISOString() }, AHORA)).toBe(true);
});

test("sin vence_at no hay vencimiento que mostrar", () => {
  // Es el caso de la vista publica, que ya filtra por fecha y no trae la columna.
  expect(vencida({}, AHORA)).toBe(false);
  expect(puedeRenovar({}, AHORA)).toBe(false);
  expect(diasParaVencer(undefined, AHORA)).toBe(null);
});
