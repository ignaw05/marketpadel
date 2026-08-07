import { test, expect } from "vitest";
import { esAdmin } from "./admin";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const C = "a3f1c0de-5b7e-4d2a-9f88-0c1b2e3d4a5b";

test("es admin el uuid que esta en la lista", () => {
  expect(esAdmin(A, A)).toBe(true);
  expect(esAdmin(B, `${A},${B}`)).toBe(true);
  expect(esAdmin(B, A)).toBe(false);
});

test("los espacios y las comas de mas no rompen la lista", () => {
  expect(esAdmin(B, ` ${A} , ${B} ,`)).toBe(true);
  expect(esAdmin(A, `\n${A}\n`)).toBe(true);
});

// Lo importante: una variable mal cargada tiene que cerrar la puerta, no abrirla.
test("sin SUPERADMIN_IDS no es admin nadie", () => {
  expect(esAdmin(A, undefined)).toBe(false);
  expect(esAdmin(A, "")).toBe(false);
  expect(esAdmin(A, "   ")).toBe(false);
  expect(esAdmin(A, ",,,")).toBe(false);
});

test("sin sesion no es admin", () => {
  expect(esAdmin(undefined, A)).toBe(false);
  expect(esAdmin(null, A)).toBe(false);
  expect(esAdmin("", A)).toBe(false);
});

test("no alcanza con parecerse al uuid de la lista", () => {
  expect(esAdmin(A.slice(0, 8), A)).toBe(false);
  expect(esAdmin(`${A}x`, A)).toBe(false);
  expect(esAdmin(A.replace("1", "9"), A)).toBe(false);
});

// Un uuid copiado en mayusculas del dashboard de Supabase es el mismo uuid.
test("el uuid matchea sin importar mayusculas", () => {
  expect(esAdmin(C, C.toUpperCase())).toBe(true);
  expect(esAdmin(C.toUpperCase(), C)).toBe(true);
});
