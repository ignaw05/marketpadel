import crypto from "node:crypto";
import { MercadoPagoConfig } from "mercadopago";

/**
 * Funcion y no constante: importar este modulo desde un test no tiene que exigir
 * MP_ACCESS_TOKEN cargado. El token es server-only, nunca NEXT_PUBLIC_.
 */
export const mp = () =>
  new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";

/** Lo unico nuestro que viaja a MP y vuelve en el webhook. */
export const armarReferencia = (paletaId: string, dias: number): string =>
  `${paletaId}:${dias}`;

/** El webhook no puede explotar con basura: cualquier cosa rara devuelve null. */
export function leerReferencia(
  ref?: string | null,
): { paletaId: string; dias: number } | null {
  const [paletaId, crudo, ...resto] = (ref ?? "").split(":");
  const dias = Number(crudo);
  if (!paletaId || resto.length || !Number.isInteger(dias) || dias <= 0) return null;
  return { paletaId, dias };
}

const ESTADOS: Record<string, string> = {
  approved: "aprobado",
  rejected: "rechazado",
  cancelled: "rechazado",
  refunded: "devuelto",
  charged_back: "devuelto",
};

/** Lo que no conocemos queda pendiente: no entregamos hasta que MP diga aprobado. */
export const traducirEstado = (mpStatus?: string | null): string =>
  ESTADOS[mpStatus ?? ""] ?? "pendiente";

/**
 * Unica barrera del webhook: el endpoint es publico y cualquiera puede postear
 * "pago aprobado". El manifest es literal, con los `;` y el orden que pide MP.
 */
export function firmaValida({
  dataId,
  requestId,
  firma,
  secreto,
}: {
  dataId: string;
  requestId: string;
  firma: string;
  secreto: string;
}): boolean {
  const partes = Object.fromEntries(
    firma
      .split(",")
      .map((p) => p.split("=").map((s) => s.trim()))
      .filter((p): p is [string, string] => p.length === 2),
  );
  const { ts, v1 } = partes;
  if (!ts || !v1 || !secreto) return false;

  // El id va en minuscula si es alfanumerico.
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac("sha256", secreto).update(manifest).digest("hex");

  return (
    hash.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(v1))
  );
}
