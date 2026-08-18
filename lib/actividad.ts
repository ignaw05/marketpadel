// Avisos de actividad de la home. Son inventados de punta a punta: sirven para
// que la pantalla no se vea muerta. Nada de esto sale de la base.
// ponytail: listas fijas, sin generador de nombres ni libreria de fake data.

const NOMBRES = [
  "M. López",
  "J. Fernández",
  "S. Gómez",
  "N. Ríos",
  "F. Díaz",
  "L. Sosa",
  "C. Ibarra",
  "P. Molina",
  "R. Quiroga",
  "V. Acosta",
  "D. Benítez",
  "A. Sánchez",
];

const ACCIONES = [
  "vendió su paleta",
  "publicó su paleta",
  "cerró la venta de su paleta",
  "encontró comprador para su paleta",
];

// Las mismas del catalogo (migracion 0001).
const MARCAS = [
  "Adidas",
  "Babolat",
  "Bullpadel",
  "Drop Shot",
  "Head",
  "Nox",
  "Royal Padel",
  "Siux",
  "StarVie",
  "Varlion",
  "Vibor-A",
  "Wilson",
];

const uno = <T,>(xs: readonly T[], rnd: number) => xs[Math.floor(rnd * xs.length)];

/** "hace 4 min" / "hace 1 h" / "hace 3 h". */
export function hace(minutos: number): string {
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `hace ${horas} h`;
}

/** Un aviso listo para mostrar. `rnd` inyectable para poder testear. */
export function aviso(rnd: () => number = Math.random): string {
  const minutos = 2 + Math.floor(rnd() * 178); // 2 min a ~3 h
  return `${uno(NOMBRES, rnd())} ${uno(ACCIONES, rnd())} ${uno(MARCAS, rnd())}, ${hace(minutos)}`;
}
