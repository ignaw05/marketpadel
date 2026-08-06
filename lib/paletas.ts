// Tipos, catalogos y formato. Sin acceso a la base: lo importan tambien los
// Client Components. Las queries viven en lib/paletas-db.ts.

export type Forma = "Diamante" | "Lágrima" | "Redonda";

export type EstadoPublicacion = "activa" | "pausada" | "vendida" | "eliminada";

export type Paleta = {
  id: string;
  vendedor_id: string;
  marca: string;
  modelo: string;
  forma: Forma;
  anio: number;
  estado: number; // 1-10
  precio: number; // ARS enteros
  provincia: string;
  ciudad: string;
  descripcion: string;
  fotos: string[];
  visitas: number;
  promocionada?: boolean;
  estado_publicacion?: EstadoPublicacion;
  /** Solo viene en las queries del dueño: la vista publica ya filtra por fecha. */
  vence_at?: string;
};

export type Vendedor = {
  nombre: string;
  apellido: string;
  whatsapp: string | null;
  miembroDesde: number;
};

export type FiltrosFeed = {
  q?: string;
  marca?: string;
  forma?: string;
  provincia?: string;
  ciudad?: string;
  precioMax?: string;
  estado?: string;
};

export const FORMAS: Forma[] = ["Diamante", "Lágrima", "Redonda"];

export const PROVINCIAS = [
  "CABA",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

const ANIO_ACTUAL = new Date().getFullYear();
export const ANIOS = Array.from({ length: 8 }, (_, i) => ANIO_ACTUAL + 1 - i);

// ponytail: tope y paso fijos del slider. Si el catalogo se pasa de PRECIO_TOPE,
// el upgrade es un max(precio) de la base cacheado en el Server Component.
export const PRECIO_TOPE = 800000;
export const PRECIO_PASO = 25000;

/** Tope de precio pedido en la URL. null = sin tope: el slider esta al maximo. */
export const topePrecio = (v?: string): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < PRECIO_TOPE ? n : null;
};

export const ESTADOS = [
  { label: "10/10 sin uso", min: 10 },
  { label: "9+ como nueva", min: 9 },
  { label: "8+ muy buena", min: 8 },
  { label: "7+ buena", min: 7 },
];

export const estadoLabel = (n: number): string => {
  if (n >= 10) return "SIN USO";
  if (n === 9) return "COMO NUEVA";
  if (n === 8) return "MUY BUENA";
  if (n === 7) return "BUENA";
  return "USADA";
};

// ponytail: Intl nativo. Precio en pesos enteros, ARS no tiene centavos en la practica.
const PESOS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatPrecio = (n: number): string => PESOS.format(n);

export const foto = (p: Pick<Paleta, "fotos">): string => p.fotos[0] ?? "";

// ---------------------------------------------------------------- promocion

/** Lo que se le cobra al vendedor por aparecer primero en las busquedas. */
export const PLANES = [
  { dias: 15, precio: 2000 },
  { dias: 30, precio: 3000 },
];

/** Misma regla que el `exists` de la vista paletas_publicas: alcanza con una vigente. */
export const promoVigente = (
  promos: { hasta: string }[] | null | undefined,
  ahora: Date = new Date(),
): boolean => (promos ?? []).some((p) => new Date(p.hasta) > ahora);

// ---------------------------------------------------------------- vencimiento

/** Lo que dura una publicacion en el feed. Renovar la estira otros tantos. */
export const DURACION_DIAS = 30;

/**
 * Ventana en la que se puede renovar. Sin esto, renovar el dia 1 estiraria el
 * aviso para siempre y el vencimiento no filtraria nada.
 */
export const RENOVAR_DESDE_DIAS = 7;

const DIA_MS = 86400000;

/** Dias que faltan para vencer, redondeados para arriba. Negativo si ya vencio. */
export const diasParaVencer = (
  vence_at: string | undefined,
  ahora: Date = new Date(),
): number | null =>
  vence_at ? Math.ceil((new Date(vence_at).getTime() - ahora.getTime()) / DIA_MS) : null;

export const vencida = (p: Pick<Paleta, "vence_at">, ahora: Date = new Date()): boolean =>
  !!p.vence_at && new Date(p.vence_at) <= ahora;

/** Se renueva sobre el final o cuando ya vencio, nunca el primer dia. */
export const puedeRenovar = (
  p: Pick<Paleta, "vence_at">,
  ahora: Date = new Date(),
): boolean => {
  const dias = diasParaVencer(p.vence_at, ahora);
  return dias !== null && dias <= RENOVAR_DESDE_DIAS;
};

/** Lado maximo que guardamos: la card mas grande del feed no pasa de 640px. */
export const MAX_LADO = 1600;

/** Achica respetando el lado largo. Nunca agranda: una foto chica queda igual. */
export const medidas = (ancho: number, alto: number, max = MAX_LADO) => {
  const escala = Math.min(1, max / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
};
