import { test, expect } from "vitest";
import { conReintento } from "./reintentar";

const sinDormir = async () => {};

test("devuelve los datos cuando sale bien a la primera", async () => {
  let veces = 0;
  const data = await conReintento(async () => {
    veces++;
    return { data: ["una paleta"], error: null };
  }, 0, sinDormir);

  expect(data).toEqual(["una paleta"]);
  expect(veces).toBe(1);
});

test("reintenta ante PGRST303 y devuelve lo del segundo intento", async () => {
  // Es el caso real: el token recien emitido al salir del login.
  let veces = 0;
  const data = await conReintento(async () => {
    veces++;
    return veces === 1
      ? { data: null, error: { code: "PGRST303", message: "JWT issued at future" } }
      : { data: ["una paleta"], error: null };
  }, 0, sinDormir);

  expect(data).toEqual(["una paleta"]);
  expect(veces).toBe(2);
});

test("si el segundo intento tambien falla, tira el error", async () => {
  let veces = 0;
  await expect(
    conReintento(async () => {
      veces++;
      return { data: null, error: { code: "PGRST303" } };
    }, 0, sinDormir),
  ).rejects.toMatchObject({ code: "PGRST303" });

  expect(veces).toBe(2);
});

test("no reintenta un error que no se arregla solo", async () => {
  // Una tabla que no existe no mejora esperando: tiene que fallar ya.
  let veces = 0;
  await expect(
    conReintento(async () => {
      veces++;
      return { data: null, error: { code: "42P01", message: "no existe" } };
    }, 0, sinDormir),
  ).rejects.toMatchObject({ code: "42P01" });

  expect(veces).toBe(1);
});

test("espera entre intentos antes de rearmar la consulta", async () => {
  const orden: string[] = [];
  await conReintento(
    async () => {
      orden.push("consulta");
      return orden.filter((o) => o === "consulta").length === 1
        ? { data: null, error: { code: "PGRST303" } }
        : { data: "ok", error: null };
    },
    1234,
    async (ms) => {
      orden.push(`dormir:${ms}`);
    },
  );

  expect(orden).toEqual(["consulta", "dormir:1234", "consulta"]);
});
