import { test, expect } from "vitest";
import { miniatura, medidas, MAX_LADO, MINI_LADO } from "./paletas";

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
