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

/**
 * Aguanta un reloj hasta ~6s atrasado sin llegar a error.tsx.
 *
 * Empezo en 3,3s por el desfasaje medido de 1 a 2s, y aun asi se escapo un
 * caso real: volver a la app con la pestaña cerrada hace mucho, o sea con el
 * token vencido, renovado por el proxy y estrenado en la misma request.
 * Esperar unos segundos de mas en ese caso es mejor que la pantalla de error,
 * y solo lo paga PGRST303: cualquier otro error corta en el primer intento.
 */
export const ESPERAS_MS = [300, 1000, 2000, 3000];

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

  // En produccion el error real no llega al browser: Next manda solo un digest.
  // Este log es lo unico que queda del codigo de PostgREST en los runtime logs.
  if (r.error) {
    console.error("[supabase]", r.error);
    throw r.error;
  }
  return r.data;
}
