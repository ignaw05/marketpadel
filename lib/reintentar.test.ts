import { test, expect } from "vitest";
import { conReintento, ESPERAS_MS } from "./reintentar";

const sinDormir = async () => {};

test("devuelve los datos cuando sale bien a la primera", async () => {
  let veces = 0;
  const data = await conReintento(async () => {
    veces++;
    return { data: ["una paleta"], error: null };
  }, [], sinDormir);

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
  }, [0], sinDormir);

  expect(data).toEqual(["una paleta"]);
  expect(veces).toBe(2);
});

test("agota los reintentos y recien ahi tira el error", async () => {
  let veces = 0;
  await expect(
    conReintento(async () => {
      veces++;
      return { data: null, error: { code: "PGRST303" } };
    }, [0, 0, 0], sinDormir),
  ).rejects.toMatchObject({ code: "PGRST303" });

  expect(veces).toBe(4);
});

test("sigue reintentando despues del segundo intento", async () => {
  // El bug real: el token recien emitido tardaba mas de un reintento en entrar.
  let veces = 0;
  const data = await conReintento(async () => {
    veces++;
    return veces < 3
      ? { data: null, error: { code: "PGRST303" } }
      : { data: "ok", error: null };
  }, ESPERAS_MS, sinDormir);

  expect(data).toBe("ok");
  expect(veces).toBe(3);
});

// El caso que se escapaba con tres esperas: volver a la app con la pestaña
// cerrada hace rato, el token vencido y renovado por el proxy en esa request.
test("aguanta un token renovado que tarda mas de tres intentos en entrar", async () => {
  let veces = 0;
  const data = await conReintento(
    async () => {
      veces++;
      return veces < 5 ? { data: null, error: { code: "PGRST303" } } : { data: "ok", error: null };
    },
    ESPERAS_MS,
    sinDormir,
  );

  expect(data).toBe("ok");
  expect(veces).toBe(5);
});

test("no reintenta un error que no se arregla solo", async () => {
  // Una tabla que no existe no mejora esperando: tiene que fallar ya.
  let veces = 0;
  await expect(
    conReintento(async () => {
      veces++;
      return { data: null, error: { code: "42P01", message: "no existe" } };
    }, ESPERAS_MS, sinDormir),
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
    [1234, 5678],
    async (ms) => {
      orden.push(`dormir:${ms}`);
    },
  );

  expect(orden).toEqual(["consulta", "dormir:1234", "consulta"]);
});
