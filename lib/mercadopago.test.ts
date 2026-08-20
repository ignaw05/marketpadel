import crypto from "node:crypto";
import { test, expect } from "vitest";
import {
  armarDonacion,
  armarReferencia,
  armarSuscripcion,
  firmaValida,
  leerDonacion,
  leerReferencia,
  leerSuscripcion,
  traducirEstado,
} from "./mercadopago";
import { PLANES } from "./paletas";
import { PLAN_PRO } from "./pro";

// --- firma del webhook ----------------------------------------------------
// Es la unica barrera del endpoint: es publico y cualquiera puede postear
// "pago aprobado". Si esto afloja, se regalan promociones.

const SECRETO = "un-secreto-de-prueba";
const DATA_ID = "1234567890";
const REQUEST_ID = "abc-123";
const TS = "1700000000";

const firmar = (
  { dataId = DATA_ID, requestId = REQUEST_ID, ts = TS, secreto = SECRETO } = {},
) =>
  crypto
    .createHmac("sha256", secreto)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest("hex");

const validar = (firma: string, dataId = DATA_ID) =>
  firmaValida({ dataId, requestId: REQUEST_ID, firma, secreto: SECRETO });

test("la firma correcta de MercadoPago pasa", () => {
  expect(validar(`ts=${TS},v1=${firmar()}`)).toBe(true);
  // el orden de las partes y los espacios los manda MP, no son estables
  expect(validar(`v1=${firmar()} , ts=${TS}`)).toBe(true);
});

test("una firma que no es la de MercadoPago se rechaza", () => {
  const bueno = firmar();

  expect(validar(`ts=${TS},v1=${"0".repeat(bueno.length)}`)).toBe(false);
  expect(validar(`ts=${TS},v1=${firmar({ secreto: "otro" })}`)).toBe(false);
  expect(validar(`ts=${TS + 1},v1=${bueno}`)).toBe(false); // ts distinto al firmado
  expect(validar(`ts=${TS},v1=${bueno}`, "9999")).toBe(false); // data.id cambiado
  expect(validar(`ts=${TS},v1=${bueno.slice(0, -2)}`)).toBe(false); // largo distinto
});

test("sin firma, sin ts o sin secreto no pasa nada", () => {
  expect(validar("")).toBe(false);
  expect(validar(`v1=${firmar()}`)).toBe(false);
  expect(validar(`ts=${TS}`)).toBe(false);
  expect(validar("basura")).toBe(false);
  expect(
    firmaValida({ dataId: DATA_ID, requestId: REQUEST_ID, firma: `ts=${TS},v1=x`, secreto: "" }),
  ).toBe(false);
});

test("el id alfanumerico se firma en minuscula", () => {
  const firma = `ts=${TS},v1=${firmar({ dataId: "abc123" })}`;
  expect(firmaValida({ dataId: "ABC123", requestId: REQUEST_ID, firma, secreto: SECRETO })).toBe(true);
});

// --- external_reference ---------------------------------------------------
// Lo unico nuestro que viaja a MP y vuelve. El webhook no puede explotar con
// lo que sea que le llegue.

test("la referencia vuelve tal cual se armo", () => {
  const id = "8f1d9a2e-0000-4000-8000-000000000001";
  expect(leerReferencia(armarReferencia(id, 30))).toEqual({ paletaId: id, dias: 30 });
});

test("una referencia rota no rompe el webhook", () => {
  for (const ref of [
    null,
    undefined,
    "",
    "solo-el-id",
    "id:",
    ":30",
    "id:abc",
    "id:0",
    "id:-15",
    "id:15.5",
    "id:15:extra",
  ]) {
    expect(leerReferencia(ref)).toBe(null);
  }
});

// --- estados --------------------------------------------------------------

test("solo approved entrega la promocion", () => {
  expect(traducirEstado("approved")).toBe("aprobado");
  expect(traducirEstado("rejected")).toBe("rechazado");
  expect(traducirEstado("cancelled")).toBe("rechazado");
  expect(traducirEstado("refunded")).toBe("devuelto");
  expect(traducirEstado("charged_back")).toBe("devuelto");
  // in_process, authorized y lo que MP invente: pendiente, no se entrega nada
  expect(traducirEstado("in_process")).toBe("pendiente");
  expect(traducirEstado("lo_que_sea")).toBe("pendiente");
  expect(traducirEstado(undefined)).toBe("pendiente");
});

// --- monto ----------------------------------------------------------------

test("el monto cobrado tiene que coincidir con el plan de esos dias", () => {
  // misma comparacion que hace el webhook antes de promocionar
  const coincide = (dias: number, monto: number) =>
    monto === PLANES.find((p) => p.dias === dias)?.precio;

  expect(coincide(15, 3000)).toBe(true);
  expect(coincide(30, 4000)).toBe(true);
  expect(coincide(30, 3000)).toBe(false); // pago los 15 dias, pide los 30
  expect(coincide(15, 1)).toBe(false);
  expect(coincide(60, 4000)).toBe(false); // dias que no son de ningun plan
});

// --- referencia de la donacion --------------------------------------------
// Lleva el vendedor adentro porque la vuelta de MP no depende de la sesion: es
// lo unico que decide de quien es la publicacion que se marca vendida.

const PALETA = "11111111-1111-1111-1111-111111111111";
const VENDEDOR = "22222222-2222-2222-2222-222222222222";

test("armarDonacion y leerDonacion son ida y vuelta", () => {
  expect(leerDonacion(armarDonacion(PALETA, VENDEDOR))).toEqual({
    paletaId: PALETA,
    vendedorId: VENDEDOR,
  });
});

test("leerDonacion devuelve null ante cualquier basura", () => {
  for (const ref of [
    undefined,
    null,
    "",
    ":",
    "donacion",
    `donacion:${PALETA}`,
    `donacion::${VENDEDOR}`,
    `donacion:${PALETA}:`,
    `donacion:${PALETA}:${VENDEDOR}:sobra`,
    `${PALETA}:30`,
    "otra:cosa:acá",
  ]) {
    expect(leerDonacion(ref)).toBeNull();
  }
});

test("el webhook de promociones no puede actuar sobre una donacion", () => {
  // Si leerReferencia aceptara esto, un pago de donacion promocionaria gratis.
  expect(leerReferencia(armarDonacion(PALETA, VENDEDOR))).toBeNull();
});

test("leerDonacion no acepta una referencia de promocion", () => {
  expect(leerDonacion(armarReferencia(PALETA, 30))).toBeNull();
});

// --- referencia de la suscripcion Pro -------------------------------------
// Lleva el perfil adentro por lo mismo que la donacion: el webhook no tiene
// sesion, y el perfil es lo unico que decide a quien se le activa el plan.

const PERFIL = "33333333-3333-3333-3333-333333333333";

test("armarSuscripcion y leerSuscripcion son ida y vuelta", () => {
  expect(leerSuscripcion(armarSuscripcion(PERFIL))).toEqual({ perfilId: PERFIL });
});

test("leerSuscripcion devuelve null ante cualquier basura", () => {
  for (const ref of [
    undefined,
    null,
    "",
    ":",
    "pro",
    "pro:",
    `:${PERFIL}`,
    `pro:${PERFIL}:sobra`,
    `donacion:${PALETA}:${VENDEDOR}`,
    `${PALETA}:30`,
  ]) {
    expect(leerSuscripcion(ref)).toBeNull();
  }
});

test("el webhook de promociones no puede actuar sobre un pago del plan", () => {
  // Si leerReferencia aceptara esto, pagar la suscripcion promocionaria una
  // paleta cuyo id seria el uuid del perfil.
  expect(leerReferencia(armarSuscripcion(PERFIL))).toBeNull();
});

test("leerSuscripcion no acepta ninguna de las otras dos referencias", () => {
  expect(leerSuscripcion(armarReferencia(PALETA, 15))).toBeNull();
  expect(leerSuscripcion(armarDonacion(PALETA, VENDEDOR))).toBeNull();
});

test("el monto cobrado tiene que ser el del plan Pro", () => {
  // misma comparacion que hace el webhook antes de activar
  expect(10000 === PLAN_PRO.precio).toBe(true);
  expect(3000 === PLAN_PRO.precio).toBe(false); // pago una promocion suelta
});
