/**
 * Reintento para los errores de PostgREST que se arreglan solos.
 *
 * El caso concreto es PGRST303 ("JWT issued at future"): justo despues de que
 * el proxy renueva el token, el JWT puede llegar a PostgREST con un `iat`
 * unos milisegundos adelantado al reloj de ese nodo, y lo rechaza. Un segundo
 * despues el mismo token sirve. Sin esto, la pantalla se cae a error.tsx por
 * un desfasaje que ya se resolvio.
 *
 * El desfasaje medido contra el proyecto es de 1 a 2 segundos, pero un solo
 * reintento a 1s no alcanzaba: el segundo intento puede caer en otro nodo de
 * PostgREST, con su propio reloj. De ahi las esperas crecientes.
 *
 * ponytail: backoff fijo, sin jitter. Si aparecen mas codigos transitorios,
 * agregarlos a la lista antes de tocar la estrategia.
 */

export const CODIGOS_REINTENTABLES = ["PGRST303"];

/** Aguanta un reloj hasta ~3s atrasado sin llegar a error.tsx. */
export const ESPERAS_MS = [300, 1000, 2000];

type Respuesta<T> = { data: T; error: { code?: string } | null };

export async function conReintento<T>(
  /** Tiene que rearmar la consulta: los builders de Supabase se usan una sola vez. */
  correr: () => PromiseLike<Respuesta<T>>,
  esperas: number[] = ESPERAS_MS,
  dormir: (ms: number) => Promise<void> = (ms) =>
    new Promise((listo) => setTimeout(listo, ms)),
): Promise<T> {
  let r = await correr();

  for (const espera of esperas) {
    if (!r.error?.code || !CODIGOS_REINTENTABLES.includes(r.error.code)) break;
    await dormir(espera);
    r = await correr();
  }

  if (r.error) throw r.error;
  return r.data;
}
