import { test, expect } from "vitest";
import { validarPaleta, validarAuth, limpiarBusqueda, type DatosPaleta } from "./validar";
import { formatPrecio, estadoLabel, foto } from "./paletas";

const ok = (): DatosPaleta => ({
  marca_id: 3,
  modelo: "Hack 04",
  forma: "Diamante",
  anio: 2026,
  estado: 9,
  precio: 275000,
  provincia: "Mendoza",
  ciudad: "Mendoza",
  descripcion: "Sin golpes en el marco.",
  fotos: [{ tipo: "image/webp", bytes: 200_000 }],
});

// --- publicar -------------------------------------------------------------

test("una paleta completa no tiene errores", () => {
  expect(validarPaleta(ok(), 2026)).toEqual({});
});

test("los campos vacios se marcan todos juntos, no de a uno", () => {
  const e = validarPaleta(
    { ...ok(), modelo: "", ciudad: "", descripcion: "", marca_id: 0 },
    2026,
  );
  expect(Object.keys(e).sort()).toEqual(["ciudad", "descripcion", "marca_id", "modelo"]);
});

test("el anio acepta hasta el que viene y rechaza el siguiente", () => {
  expect(validarPaleta({ ...ok(), anio: 2027 }, 2026).anio).toBeUndefined();
  expect(validarPaleta({ ...ok(), anio: 2028 }, 2026).anio).toBeDefined();
  expect(validarPaleta({ ...ok(), anio: 1999 }, 2026).anio).toBeDefined();
});

test("el precio tiene que ser mayor a cero", () => {
  expect(validarPaleta({ ...ok(), precio: 0 }, 2026).precio).toBeDefined();
  expect(validarPaleta({ ...ok(), precio: -5 }, 2026).precio).toBeDefined();
  expect(validarPaleta({ ...ok(), precio: 1 }, 2026).precio).toBeUndefined();
});

test("el estado va de 1 a 10 inclusive", () => {
  expect(validarPaleta({ ...ok(), estado: 10 }, 2026).estado).toBeUndefined();
  expect(validarPaleta({ ...ok(), estado: 11 }, 2026).estado).toBeDefined();
  expect(validarPaleta({ ...ok(), estado: 0 }, 2026).estado).toBeDefined();
});

test("forma y provincia solo aceptan valores del catalogo", () => {
  expect(validarPaleta({ ...ok(), forma: "Cuadrada" }, 2026).forma).toBeDefined();
  expect(validarPaleta({ ...ok(), provincia: "Montevideo" }, 2026).provincia).toBeDefined();
});

test("modelo y descripcion respetan los limites del schema", () => {
  expect(validarPaleta({ ...ok(), modelo: "x".repeat(120) }, 2026).modelo).toBeUndefined();
  expect(validarPaleta({ ...ok(), modelo: "x".repeat(121) }, 2026).modelo).toBeDefined();
  expect(validarPaleta({ ...ok(), descripcion: "x".repeat(300) }, 2026).descripcion).toBeUndefined();
  expect(validarPaleta({ ...ok(), descripcion: "x".repeat(301) }, 2026).descripcion).toBeDefined();
});

test("las fotos: al menos una, hasta 4, imagenes, menos de 5 MB", () => {
  const foto = (tipo: string, bytes = 1000) => ({ tipo, bytes });
  expect(validarPaleta({ ...ok(), fotos: [] }, 2026).fotos).toBeDefined();
  expect(
    validarPaleta({ ...ok(), fotos: Array(5).fill(foto("image/webp")) }, 2026).fotos,
  ).toBeDefined();
  expect(
    validarPaleta({ ...ok(), fotos: [foto("application/pdf")] }, 2026).fotos,
  ).toBeDefined();
  expect(
    validarPaleta({ ...ok(), fotos: [foto("image/webp", 6_000_000)] }, 2026).fotos,
  ).toBeDefined();
  expect(
    validarPaleta({ ...ok(), fotos: Array(4).fill(foto("image/png")) }, 2026).fotos,
  ).toBeUndefined();
});

// --- auth -----------------------------------------------------------------

test("login solo pide email y contraseña", () => {
  const d = { email: "a@b.com", password: "x", nombre: "", apellido: "" };
  expect(validarAuth(d, "login")).toEqual({});
  // en registro esa misma contraseña es muy corta y falta el nombre
  const e = validarAuth(d, "registro");
  expect(e.password).toBeDefined();
  expect(e.nombre).toBeDefined();
  expect(e.apellido).toBeDefined();
});

test("emails invalidos se rechazan", () => {
  const base = { password: "unaClaveLarga", nombre: "A", apellido: "B" };
  for (const email of ["", "a@b", "sinarroba.com", "a b@c.com", "@b.com"]) {
    expect(validarAuth({ ...base, email }, "registro").email).toBeDefined();
  }
  expect(validarAuth({ ...base, email: "ana@marketpadel.com.ar" }, "registro").email)
    .toBeUndefined();
});

// --- busqueda -------------------------------------------------------------

test("la busqueda saca los caracteres que rompen el .or() de PostgREST", () => {
  // sin limpiar, la coma cortaria el filtro y el resto se leeria como otra condicion
  expect(limpiarBusqueda("bullpadel,vendedor_id.eq.1")).toBe("bullpadel vendedor_id eq 1");
  expect(limpiarBusqueda("hack (04)")).toBe("hack  04");
  expect(limpiarBusqueda("  vertex  ")).toBe("vertex");
  expect(limpiarBusqueda("*")).toBe("");
});

// --- formato es-AR --------------------------------------------------------

test("los precios se muestran en pesos sin decimales", () => {
  // NBSP entre el signo y el numero: comparo sin espacios
  expect(formatPrecio(145000).replace(/\s/g, "")).toBe("$145.000");
  expect(formatPrecio(600000).replace(/\s/g, "")).toBe("$600.000");
});

test("la etiqueta de estado cubre todos los tramos", () => {
  expect(estadoLabel(10)).toBe("SIN USO");
  expect(estadoLabel(9)).toBe("COMO NUEVA");
  expect(estadoLabel(8)).toBe("MUY BUENA");
  expect(estadoLabel(7)).toBe("BUENA");
  expect(estadoLabel(6)).toBe("USADA");
});

test("foto() no explota cuando la paleta no tiene ninguna", () => {
  expect(foto({ fotos: [] })).toBe("");
  expect(foto({ fotos: ["a.webp", "b.webp"] })).toBe("a.webp");
});
