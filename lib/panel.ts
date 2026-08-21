// Derivaciones del panel. Puras a proposito: son las cuentas que la UI hace
// sobre lo que devuelven las RPC, y las dos tienen un caso borde que con el
// volumen actual es el caso NORMAL, no el raro.

export type Signo = "sube" | "baja" | "igual";

export type Variacion = { signo: Signo; absoluto: number };

/**
 * Cuanto se movio una metrica contra la ventana anterior.
 *
 * `anterior` en null significa "no hay contra que comparar" (el rango 'total'
 * no tiene un antes), y ahi devuelve null para que la UI no dibuje ninguna
 * flecha. Eso es distinto de un anterior en 0, que si es una comparacion
 * valida: subir de 0 a 5 es una suba.
 */
export function variacion(
  actual: number,
  anterior: number | null | undefined,
): Variacion | null {
  if (anterior === null || anterior === undefined) return null;
  const absoluto = actual - anterior;
  if (absoluto === 0) return { signo: "igual", absoluto: 0 };
  return { signo: absoluto > 0 ? "sube" : "baja", absoluto: Math.abs(absoluto) };
}

/**
 * Porcentaje entero de `parte` sobre `total`, o null si el total es 0.
 *
 * El null no es paranoia: con cero pagos en la ventana o un catalogo vacio,
 * dividir daria NaN y la pantalla mostraria "NaN%".
 */
export function porcentaje(parte: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((parte / total) * 100);
}
