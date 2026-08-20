// Vendedor Pro: constantes y reglas del plan. Sin acceso a la base, como
// lib/paletas.ts: lo importan tambien los Client Components. Las queries viven
// en lib/pro-db.ts.

import { diasParaVencer } from "./paletas";

/**
 * El plan. `precio` es lo que se cobra por periodo y lo verifica el webhook
 * contra lo que MercadoPago cobro de verdad, asi que cambiarlo aca cambia las
 * dos puntas a la vez.
 *
 * `creditos` no manda: el limite real vive en el trigger promociones_validar
 * (0001_init.sql), que corta el cuarto insert. Esto es para dibujar.
 */
export const PLAN_PRO = {
  precio: 10000,
  dias: 30,
  creditos: 3,
  /** Lo que dura una promocion pagada con un credito. */
  diasPromo: 15,
};

/** Dias antes del vencimiento en que se empieza a avisar dentro de la app. */
export const AVISAR_DESDE_DIAS = 3;

/**
 * Dias despues del vencimiento en que se sigue avisando. Sin este techo, el que
 * probo el plan una vez en 2026 veria "se vencio" para siempre.
 */
export const AVISAR_HASTA_DIAS = 7;

export const esPro = (pro_hasta: string | null | undefined, ahora: Date = new Date()): boolean =>
  !!pro_hasta && new Date(pro_hasta) > ahora;

/**
 * Creditos que quedan. Se acota a [0, creditos] porque `usados` viene de un
 * count() de la base: una cortesia cargada a mano podria pasarse de 3 y dejar
 * el numero en negativo.
 */
export const creditosRestantes = (usados: number): number =>
  Math.min(PLAN_PRO.creditos, Math.max(0, PLAN_PRO.creditos - usados));

export type AvisoPro = "vence-pronto" | "vencido" | null;

/**
 * Que cartel corresponde mostrar. Es el aviso dentro de la app que hace las
 * veces del mail de vencimiento.
 *
 * ponytail: aca entra el mail cuando paletita.com.ar este verificado en un
 * proveedor de envio. El "cuando" ya esta resuelto y testeado; lo que falta es
 * el canal y un cron diario que lo dispare.
 */
export function avisoPro(
  pro_hasta: string | null | undefined,
  ahora: Date = new Date(),
): AvisoPro {
  if (!pro_hasta) return null;

  const dias = diasParaVencer(pro_hasta, ahora);
  if (dias === null) return null;
  if (dias > 0) return dias <= AVISAR_DESDE_DIAS ? "vence-pronto" : null;
  return dias >= -AVISAR_HASTA_DIAS ? "vencido" : null;
}
