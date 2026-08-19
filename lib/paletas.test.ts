import { test, expect } from "vitest";
import {
  miniatura,
  medidas,
  montoDonacion,
  MAX_LADO,
  MINI_LADO,
  MONTOS_DONACION,
  MONTO_DONACION_MAX,
  MONTO_DONACION_MIN,
} from "./paletas";

const BUCKET = "https://xyz.supabase.co/storage/v1/object/public/paletas";

test("miniatura mete el sufijo antes de la extension", () => {
  expect(miniatura(`${BUCKET}/uid/abc.webp`)).toBe(`${BUCKET}/uid/abc-mini.webp`);
  expect(miniatura(`${BUCKET}/uid/abc.jpg`)).toBe(`${BUCKET}/uid/abc-mini.jpg`);
});

test("miniatura no se confunde con puntos en el resto de la ruta", () => {
  expect(miniatura(`${BUCKET}/uid.raro/a.b/c.webp`)).toBe(`${BUCKET}/uid.raro/a.b/c-mini.webp`);
});

test("miniatura sin extension devuelve la misma url", () => {
  // El fallback de ImageWithFallback termina sirviendo la grande.
  expect(miniatura(`${BUCKET}/uid/abc`)).toBe(`${BUCKET}/uid/abc`);
});

test("medidas achica al lado largo y nunca agranda", () => {
  expect(medidas(3200, 2400)).toEqual({ ancho: MAX_LADO, alto: 1200 });
  expect(medidas(800, 1000, MINI_LADO)).toEqual({ ancho: 320, alto: MINI_LADO });
  expect(medidas(300, 200, MINI_LADO)).toEqual({ ancho: 300, alto: 200 });
});

// --- monto de la donacion -------------------------------------------------
// Lo elige quien dona, asi que es el unico monto de la app que llega del form.

test("montoDonacion acepta los enteros del rango", () => {
  expect(montoDonacion(MONTO_DONACION_MIN)).toBe(MONTO_DONACION_MIN);
  expect(montoDonacion(MONTO_DONACION_MAX)).toBe(MONTO_DONACION_MAX);
  expect(montoDonacion("2000")).toBe(2000);
  expect(montoDonacion(" 2000 ")).toBe(2000);
  for (const m of MONTOS_DONACION) expect(montoDonacion(m)).toBe(m);
});

test("montoDonacion rechaza todo lo que no sea un entero en rango", () => {
  for (const crudo of [
    undefined,
    null,
    "",
    "   ",
    "abc",
    "1000.5",
    1000.5,
    0,
    -1000,
    MONTO_DONACION_MIN - 1,
    MONTO_DONACION_MAX + 1,
    Infinity,
    NaN,
  ]) {
    expect(montoDonacion(crudo)).toBeNull();
  }
});
