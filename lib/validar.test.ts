import { test, expect } from "vitest";
import {
  validarPaleta,
  validarFotos,
  validarAuth,
  limpiarBusqueda,
  armarWhatsapp,
  PREFIJO_WHATSAPP,
  type DatosPaleta,
} from "./validar";
import {
  formatPrecio,
  estadoLabel,
  foto,
  topePrecio,
  medidas,
  PRECIO_TOPE,
} from "./paletas";

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
  fotos: ["https://x.supabase.co/storage/v1/object/public/paletas/u/1.webp"],
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

test("publicar exige entre una y 4 fotos ya subidas", () => {
  const url = ok().fotos[0];
  expect(validarPaleta({ ...ok(), fotos: [] }, 2026).fotos).toBeDefined();
  expect(validarPaleta({ ...ok(), fotos: Array(5).fill(url) }, 2026).fotos).toBeDefined();
  expect(validarPaleta({ ...ok(), fotos: Array(4).fill(url) }, 2026).fotos).toBeUndefined();
});

test("los archivos se filtran antes de subir: imagenes, hasta 4, menos de 5 MB", () => {
  const f = (tipo: string, bytes = 1000) => ({ tipo, bytes });
  expect(validarFotos([])).toBeDefined();
  expect(validarFotos(Array(5).fill(f("image/webp")))).toBeDefined();
  expect(validarFotos([f("application/pdf")])).toBeDefined();
  expect(validarFotos([f("image/webp", 6_000_000)])).toBeDefined();
  expect(validarFotos(Array(4).fill(f("image/png")))).toBeUndefined();
});

// --- auth -----------------------------------------------------------------

const auth = () => ({
  email: "ana@marketpadel.com.ar",
  password: "unaClaveLarga",
  nombre: "Ana",
  apellido: "Diaz",
  whatsappPrefijo: PREFIJO_WHATSAPP,
  whatsappNumero: "11 5555 5555",
});

test("un registro completo no tiene errores", () => {
  expect(validarAuth(auth(), "registro")).toEqual({});
});

test("login solo pide email y contraseña", () => {
  const d = { ...auth(), password: "x", nombre: "", apellido: "", whatsappNumero: "" };
  expect(validarAuth(d, "login")).toEqual({});
  // los mismos datos en registro fallan por todo lo que login no mira
  const e = validarAuth(d, "registro");
  expect(e.password).toBeDefined();
  expect(e.nombre).toBeDefined();
  expect(e.apellido).toBeDefined();
  expect(e.whatsapp).toBeDefined();
});

test("emails invalidos se rechazan", () => {
  for (const email of ["", "a@b", "sinarroba.com", "a b@c.com", "@b.com"]) {
    expect(validarAuth({ ...auth(), email }, "registro").email).toBeDefined();
  }
  expect(validarAuth(auth(), "registro").email).toBeUndefined();
});

test("el whatsapp exige numero y cuenta los digitos con el prefijo", () => {
  const con = (whatsappNumero: string, whatsappPrefijo = PREFIJO_WHATSAPP) =>
    validarAuth({ ...auth(), whatsappPrefijo, whatsappNumero }, "registro").whatsapp;

  expect(con("")).toBeDefined();
  expect(con("   ")).toBeDefined();
  expect(con("11 5555")).toBeDefined(); // +5491155555 = 9 digitos, faltan
  expect(con("1".repeat(14))).toBeDefined(); // pasa los 15 de E.164
  expect(con("11 5555 5555")).toBeUndefined();
  expect(con("11-5555-5555")).toBeUndefined(); // guiones sirven
  expect(con("no tengo")).toBeDefined(); // letras en el numero

  // borrar el prefijo es un error, no vuelve solo a +54 9
  expect(con("1155555555", "")).toBeDefined();
  expect(con("11 5555 5555", "abc")).toBeDefined();
  expect(con("555 1234", "+1")).toBeDefined(); // 8 digitos, corto
  expect(con("305 555 1234", "+1")).toBeUndefined(); // otro pais anda
});

test("el whatsapp se guarda como un solo texto con el prefijo adelante", () => {
  expect(armarWhatsapp("+54 9", "11 5555 5555")).toBe("+54 9 11 5555 5555");
  expect(armarWhatsapp("  +54 9  ", "  1155555555 ")).toBe("+54 9 1155555555");
  expect(armarWhatsapp("", "1155555555")).toBe("1155555555");
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

test("el tope de precio ignora lo que no filtra nada", () => {
  expect(topePrecio("150000")).toBe(150000);
  expect(topePrecio(undefined)).toBe(null); // sin filtro
  expect(topePrecio("")).toBe(null);
  expect(topePrecio("caro")).toBe(null); // ?precioMax=caro no tiene que romper la query
  expect(topePrecio("-1")).toBe(null);
  expect(topePrecio(String(PRECIO_TOPE))).toBe(null); // el slider al maximo es "sin tope"
});

test("achicar respeta la proporcion y no agranda", () => {
  // vertical de celular: manda el lado largo
  expect(medidas(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 });
  expect(medidas(4032, 3024)).toEqual({ ancho: 1600, alto: 1200 });
  expect(medidas(1600, 1600)).toEqual({ ancho: 1600, alto: 1600 });
  expect(medidas(800, 600)).toEqual({ ancho: 800, alto: 600 }); // ya es chica
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
