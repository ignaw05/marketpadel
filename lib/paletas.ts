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
  ciudad?: string;
  precio?: string;
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

export const PRECIOS = [
  { label: "Hasta $ 200.000", min: 0, max: 200000 },
  { label: "$ 200.000 – $ 350.000", min: 200000, max: 350000 },
  { label: "Más de $ 350.000", min: 350000, max: null },
];

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
