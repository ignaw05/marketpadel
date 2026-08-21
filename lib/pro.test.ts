import { test, expect } from "vitest";
import { PLAN_PRO, esPro, creditosRestantes, avisoPro, debeVerAnuncioPro } from "./pro";

const AHORA = new Date("2026-08-20T12:00:00Z");
const enDias = (d: number) =>
  new Date(AHORA.getTime() + d * 86400000).toISOString();

// --- vigencia ---

test("sin fecha no hay plan", () => {
  expect(esPro(null, AHORA)).toBe(false);
  expect(esPro(undefined, AHORA)).toBe(false);
});

test("el plan vale hasta el instante en que vence, no despues", () => {
  expect(esPro(enDias(1), AHORA)).toBe(true);
  expect(esPro(AHORA.toISOString(), AHORA)).toBe(false);
  expect(esPro(enDias(-1), AHORA)).toBe(false);
});

// --- creditos ---

test("los creditos arrancan en 3 y bajan de a uno", () => {
  expect(creditosRestantes(0)).toBe(PLAN_PRO.creditos);
  expect(creditosRestantes(1)).toBe(2);
  expect(creditosRestantes(3)).toBe(0);
});

test("una cortesia cargada a mano no deja el contador en negativo", () => {
  // El limite real lo pone el trigger de la base, pero una fila insertada con
  // service role puede pasarse. Que la UI no muestre "-1 disponibles".
  expect(creditosRestantes(5)).toBe(0);
});

// --- aviso dentro de la app ---

test("sin plan no se avisa nada", () => {
  expect(avisoPro(null, AHORA)).toBe(null);
});

test("con el plan lejos de vencer no se avisa", () => {
  expect(avisoPro(enDias(19), AHORA)).toBe(null);
  expect(avisoPro(enDias(4), AHORA)).toBe(null);
});

test("se avisa desde los 3 dias y hasta el ultimo momento", () => {
  expect(avisoPro(enDias(3), AHORA)).toBe("vence-pronto");
  expect(avisoPro(enDias(1), AHORA)).toBe("vence-pronto");
  // Doce horas redondean para arriba: sigue siendo "vence", no "vencio".
  expect(avisoPro(enDias(0.5), AHORA)).toBe("vence-pronto");
});

test("vencido es un aviso distinto, no la ausencia de aviso", () => {
  // Si esto devolviera null, el vendedor perderia la cinta sin enterarse.
  expect(avisoPro(AHORA.toISOString(), AHORA)).toBe("vencido");
  expect(avisoPro(enDias(-7), AHORA)).toBe("vencido");
});

test("el aviso de vencido no se queda pegado para siempre", () => {
  // El que probo el plan una vez hace meses no tiene que seguir viendo el
  // cartel rojo cada vez que entra a sus publicaciones.
  expect(avisoPro(enDias(-8), AHORA)).toBe(null);
  expect(avisoPro(enDias(-400), AHORA)).toBe(null);
});

// --- anuncio del plan ---

test("el anuncio no le sale al que no esta registrado", () => {
  expect(debeVerAnuncioPro(null, AHORA)).toBe(false);
});

test("el anuncio le sale una sola vez al registrado que no es Pro", () => {
  expect(debeVerAnuncioPro({ pro_hasta: null, vio_anuncio_pro: false }, AHORA)).toBe(true);
  expect(debeVerAnuncioPro({ pro_hasta: null, vio_anuncio_pro: true }, AHORA)).toBe(false);
});

test("al que ya es Pro no se le vende el plan que tiene", () => {
  expect(debeVerAnuncioPro({ pro_hasta: enDias(5), vio_anuncio_pro: false }, AHORA)).toBe(false);
  // Vencido no es Pro: a ese si le corresponde, si nunca lo vio.
  expect(debeVerAnuncioPro({ pro_hasta: enDias(-1), vio_anuncio_pro: false }, AHORA)).toBe(true);
});

test("una fila vieja, sin la columna cargada, cuenta como no visto", () => {
  // La columna es NOT NULL DEFAULT false, pero un select que no la pida deja
  // undefined: mejor mostrarlo de mas que perder el anuncio en silencio.
  expect(debeVerAnuncioPro({ pro_hasta: null }, AHORA)).toBe(true);
});
