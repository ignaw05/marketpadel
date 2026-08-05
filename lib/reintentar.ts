/**
 * Reintento para los errores de PostgREST que se arreglan solos.
 *
 * El caso concreto es PGRST303 ("JWT issued at future"): justo despues de que
 * el proxy renueva el token, el JWT puede llegar a PostgREST con un `iat`
 * unos milisegundos adelantado al reloj de ese nodo, y lo rechaza. Un segundo
 * despues el mismo token sirve. Sin esto, la pantalla se cae a error.tsx por
 * un desfasaje que ya se resolvio.
 *
 * ponytail: un solo reintento con espera fija. Si aparecen mas codigos
 * transitorios, backoff exponencial.
 */

export const CODIGOS_REINTENTABLES = ["PGRST303"];

type Respuesta<T> = { data: T; error: { code?: string } | null };

export async function conReintento<T>(
  /** Tiene que rearmar la consulta: los builders de Supabase se usan una sola vez. */
  correr: () => PromiseLike<Respuesta<T>>,
  esperaMs = 1000,
  dormir: (ms: number) => Promise<void> = (ms) =>
    new Promise((listo) => setTimeout(listo, ms)),
): Promise<T> {
  let r = await correr();

  if (r.error?.code && CODIGOS_REINTENTABLES.includes(r.error.code)) {
    await dormir(esperaMs);
    r = await correr();
  }

  if (r.error) throw r.error;
  return r.data;
}
