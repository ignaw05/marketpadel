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
  acepta_permuta: boolean;
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

export type Venta = {
  id: string;
  marca: string;
  modelo: string;
  estado: number; // 1-10
  precio: number;
  fotos: string[];
  vendida_at: string;
};

export type FiltrosFeed = {
  q?: string;
  marca?: string;
  forma?: string;
  provincia?: string;
  precioMax?: string;
  estado?: string;
  permuta?: string;
  orden?: string;
  pagina?: string;
};

/** Las claves que filtran de verdad. `pagina` no filtra: pagina. */
export const CLAVES_FILTRO = [
  "q",
  "marca",
  "forma",
  "provincia",
  "precioMax",
  "estado",
  "permuta",
] as const satisfies readonly (keyof FiltrosFeed)[];

/**
 * Titulo del feed segun los filtros puestos. Es el h1 de la home y el <title>
 * de la pestana a la vez: la misma frase que el usuario ve es la que indexa
 * Google, y filtrar por marca deja de ser una pagina sin nombre.
 */
export const tituloFeed = (f: FiltrosFeed): string =>
  [
    "Paletas de pádel",
    f.marca,
    "usadas",
    f.provincia ? `en ${f.provincia}` : "en Argentina",
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Que URL del feed merece ser una pagina propia para Google.
 *
 * marca y provincia son un catalogo cerrado y chico: "paletas Bullpadel
 * usadas en Córdoba" es una busqueda real y da una lista distinta. El resto
 * (texto libre, precio, estado, forma, orden, paginado) multiplica
 * combinaciones que son la misma lista reordenada, y eso se lleva el
 * presupuesto de rastreo sin traer una sola visita.
 *
 * El path sale siempre con las claves en el mismo orden: ?provincia=X&marca=Y
 * y ?marca=Y&provincia=X son la misma pagina y tienen que colapsar en una
 * canonica.
 */
export const canonicaFeed = (f: FiltrosFeed): { path: string; indexable: boolean } => {
  const qs = new URLSearchParams();
  if (f.marca) qs.set("marca", f.marca);
  if (f.provincia) qs.set("provincia", f.provincia);

  return {
    path: qs.size ? `/?${qs}` : "/",
    indexable:
      !f.q &&
      !f.forma &&
      !f.precioMax &&
      !f.estado &&
      !f.permuta &&
      paginaActual(f.pagina) === 1,
  };
};

// ------------------------------------------------------------------- orden

/**
 * Orden del feed. El primero es el default.
 *
 * `columna` es una columna real de paletas_publicas y el valor de la URL nunca
 * llega crudo a la query: se resuelve contra esta lista.
 */
export const ORDENES = [
  { valor: "precio-desc", label: "Mayor precio", columna: "precio", asc: false },
  { valor: "recientes", label: "Más recientes", columna: "created_at", asc: false },
  { valor: "precio-asc", label: "Menor precio", columna: "precio", asc: true },
  { valor: "vistas", label: "Más vistas", columna: "visitas", asc: false },
] as const;

export type Orden = (typeof ORDENES)[number];

/** Orden pedido en la URL. Cualquier cosa rara cae en el default. */
export const ordenActual = (v?: string): Orden =>
  ORDENES.find((o) => o.valor === v) ?? ORDENES[0];

// ---------------------------------------------------------------- paginacion

/**
 * Divisible por 2, 3 y 4: la grilla es de 2 columnas en mobile, 3 en md y 4 en
 * xl, asi que la ultima fila nunca queda coja.
 *
 * Medido: con 60 por pagina el HTML del home pesaba 462 KB y el p50 a 50
 * usuarios concurrentes se iba a 823 ms. El tamaño del resultado era el freno,
 * no el de la tabla.
 */
export const POR_PAGINA = 24;

/**
 * Tope de paginas. Es una guarda, no una funcionalidad: `pagina` viene de la
 * URL y se traduce en un OFFSET, asi que sin esto un ?pagina=99999999 le pide
 * a Postgres que descarte cien millones de filas para devolver cero.
 */
const PAGINA_TOPE = 500;

/** Pagina pedida en la URL. Cualquier cosa rara cae en 1. */
export const paginaActual = (v?: string): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, PAGINA_TOPE);
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

/**
 * Opciones del filtro de permuta. "Todas" no esta en la lista: es no mandar el
 * parametro, igual que en el resto de los Dropdown.
 *
 * Los valores viajan en la URL tal cual se leen, con acento y todo, como ya lo
 * hace el filtro de estado con sus labels. Cualquier otra cosa en ?permuta= se
 * ignora en la query: no hay valor libre que llegue crudo a la base.
 */
export const PERMUTA = ["S\u00ed", "No"];

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
  { dias: 15, precio: 3000, precioAntes: 6000 },
  { dias: 30, precio: 4000, precioAntes: 8000 },
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

/** Lado de la miniatura que se sube junto a la foto: la card del feed no pasa de 200 CSS px. */
export const MINI_LADO = 400;

/**
 * URL (o ruta de storage) de la miniatura de una foto: `a/b.webp` -> `a/b-mini.webp`.
 * ponytail: convencion de nombre, no una columna nueva. La miniatura se deriva de la
 * URL grande que ya esta en `fotos[]`, asi que no hay migracion ni dato que sincronizar.
 * Si la foto no tiene extension, devuelve la misma URL y se sirve la grande.
 */
export const miniatura = (url: string): string => url.replace(/(\.[^./]+)$/, "-mini$1");

// ---------------------------------------------------------------- donacion

/** Sugerencias, no precios: quien dona elige. */
export const MONTOS_DONACION = [1000, 2000, 5000];

export const MONTO_DONACION_MIN = 500;
export const MONTO_DONACION_MAX = 500_000;

/**
 * Null ante cualquier cosa que no sea un monto entero en rango. El piso es de
 * MercadoPago; el techo evita el cero de mas al tipear en el celular.
 */
export function montoDonacion(crudo: unknown): number | null {
  const texto = String(crudo ?? "").trim();
  if (!texto) return null;

  const n = Number(texto);
  if (!Number.isInteger(n) || n < MONTO_DONACION_MIN || n > MONTO_DONACION_MAX) return null;
  return n;
}
