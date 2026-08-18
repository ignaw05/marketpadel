import { test, expect } from "vitest";
import { requiereSesion } from "./acceso";

test("con el gate prendido pide sesion en todo menos login, legales y SEO", () => {
  expect(requiereSesion("/", true)).toBe(true);
  expect(requiereSesion("/paletas/babolat-hack-04", true)).toBe(true);
  expect(requiereSesion("/cuenta", true)).toBe(true);
  expect(requiereSesion("/auth", true)).toBe(false);
  expect(requiereSesion("/auth/nueva", true)).toBe(false);
  expect(requiereSesion("/terminos", true)).toBe(false);
  expect(requiereSesion("/sitemap.xml", true)).toBe(false);
});

test("con el gate apagado solo pide sesion en las privadas de siempre", () => {
  expect(requiereSesion("/", false)).toBe(false);
  expect(requiereSesion("/paletas/babolat-hack-04", false)).toBe(false);
  expect(requiereSesion("/publicar", false)).toBe(true);
  expect(requiereSesion("/mis-publicaciones", false)).toBe(true);
  expect(requiereSesion("/editar/123", false)).toBe(true);
});
