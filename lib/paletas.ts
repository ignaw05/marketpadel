export type Forma = "Diamante" | "Lágrima" | "Redonda";

export type Paleta = {
  id: string;
  marca: string;
  modelo: string;
  forma: Forma;
  anio: number;
  estado: number; // 1-10
  precio: number; // ARS
  provincia: string;
  ciudad: string;
  ubicacion: string; // ciudad mostrada
  imagen: string;
  descripcion: string;
  vendedor: { nombre: string; apellido: string; miembroDesde: number };
  mia?: boolean;
  activa?: boolean;
  visitas?: number;
};

export const MARCAS = ["Adidas", "Babolat", "Bullpadel"];

export const FORMAS: Forma[] = ["Diamante", "Lágrima", "Redonda"];

export const PROVINCIAS = [
  "CABA",
  "Buenos Aires",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Neuquén",
  "Tucumán",
  "Salta",
];

export const ANIOS = [2027, 2026, 2025, 2024, 2023, 2022];

export const estadoLabel = (n: number): string => {
  if (n >= 10) return "SIN USO";
  if (n === 9) return "COMO NUEVA";
  if (n === 8) return "MUY BUENA";
  if (n === 7) return "BUENA";
  return "USADA";
};

export const formatPrecio = (n: number): string =>
  "$ " + n.toLocaleString("es-AR");

const img = (u: string) => `${u}`;

export const PALETAS: Paleta[] = [
  {
    id: "p0",
    marca: "Babolat",
    modelo: "Air Veron 2023",
    forma: "Diamante",
    anio: 2023,
    estado: 9,
    precio: 145000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("/paletas/p0-babolat-air-veron-2023.webp"),
    descripcion:
      "Diamante híbrida, liviana y con buen punch para nivel intermedio. La usé un año, sin golpes en el marco. Vendo porque me pasé a una más pesada.",
    vendedor: { nombre: "Ignacio", apellido: "Wuilloud", miembroDesde: 2026 },
  },
  {
    id: "p1",
    marca: "Adidas",
    modelo: "Metalbone Pro EDT 2026 (Ale Galán)",
    forma: "Diamante",
    anio: 2026,
    estado: 9,
    precio: 665000,
    provincia: "CABA",
    ciudad: "CABA",
    ubicacion: "CABA",
    imagen: img("/paletas/p1-adidas-metalbone-pro-edt-2026.webp"),
    descripcion:
      "La Pro EDT de Galán, poquísimo uso. Pegador puro, sale con una potencia bárbara. Viene con paletero original y protector.",
    vendedor: { nombre: "Martín", apellido: "Gómez", miembroDesde: 2024 },
  },
  {
    id: "p2",
    marca: "Adidas",
    modelo: "Metalbone Reserve EDT 2026 (Ale Galán)",
    forma: "Diamante",
    anio: 2026,
    estado: 8,
    precio: 340000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("/paletas/p2-adidas-metalbone-reserve-edt-2026.webp"),
    descripcion:
      "Edición Reserve, blanca con detalles rojos. La vendo porque necesito la plata ya, precio de ganga para que se mueva rápido.",
    vendedor: { nombre: "Lucía", apellido: "Fernández", miembroDesde: 2023 },
  },
  {
    id: "p3",
    marca: "Adidas",
    modelo: "Metalbone 2026 (Ale Galán)",
    forma: "Diamante",
    anio: 2026,
    estado: 10,
    precio: 610000,
    provincia: "Santa Fe",
    ciudad: "Rosario",
    ubicacion: "Rosario",
    imagen: img("/paletas/p3-adidas-metalbone-2026.webp"),
    descripcion:
      "Sin uso, todavía con el plástico del puño. La compré y no llegué a estrenarla. Entrego con factura.",
    vendedor: { nombre: "Nicolás", apellido: "Pérez", miembroDesde: 2024 },
  },
  {
    id: "p4",
    marca: "Babolat",
    modelo: "Technical Viper (Juan Lebrón)",
    forma: "Lágrima",
    anio: 2026,
    estado: 7,
    precio: 480000,
    provincia: "Córdoba",
    ciudad: "Córdoba",
    ubicacion: "Córdoba",
    imagen: img("/paletas/p4-babolat-technical-viper.webp"),
    descripcion:
      "La de Lebrón, rígida y directa. Se nota el uso pero anda perfecta, sin roturas. La vendo porque cambié de forma.",
    vendedor: { nombre: "Diego", apellido: "Sosa", miembroDesde: 2022 },
  },
  {
    id: "p5",
    marca: "Babolat",
    modelo: "Technical Veron (Juan Lebrón)",
    forma: "Diamante",
    anio: 2026,
    estado: 9,
    precio: 430000,
    provincia: "Buenos Aires",
    ciudad: "La Plata",
    ubicacion: "La Plata",
    imagen: img("/paletas/p5-babolat-technical-veron.webp"),
    descripcion:
      "Muy buena, Carbon Flex con tacto más cómodo que la Viper. Marco sano, solo detalles mínimos de pintura.",
    vendedor: { nombre: "Sofía", apellido: "Romero", miembroDesde: 2023 },
  },
  {
    id: "p6",
    marca: "Babolat",
    modelo: "Technical Vertuo (Juan Lebrón)",
    forma: "Redonda",
    anio: 2026,
    estado: 8,
    precio: 140000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("/paletas/p6-babolat-technical-vertuo.webp"),
    descripcion:
      "Redonda, liviana y muy manejable. Ideal para arrancar en serio. La dejo baratísima porque me pasé a una diamante.",
    vendedor: { nombre: "Tomás", apellido: "Álvarez", miembroDesde: 2024 },
  },
  {
    id: "p7",
    marca: "Bullpadel",
    modelo: "Hack 04 Dale Candela LTD 2026 (Paquito Navarro)",
    forma: "Diamante",
    anio: 2026,
    estado: 10,
    precio: 600000,
    provincia: "Buenos Aires",
    ciudad: "Mar del Plata",
    ubicacion: "Mar del Plata",
    imagen: img("/paletas/p7-bullpadel-hack-04-dale-candela.webp"),
    descripcion:
      "Edición limitada homenaje a Paquito, con la guitarra y el 'dale candela' estampados. Sin uso, viene en su caja original.",
    vendedor: { nombre: "Valentina", apellido: "Díaz", miembroDesde: 2021 },
  },
  {
    id: "p8",
    marca: "Bullpadel",
    modelo: "Pearl 2027 (Bea González)",
    forma: "Redonda",
    anio: 2027,
    estado: 7,
    precio: 195000,
    provincia: "CABA",
    ciudad: "CABA",
    ubicacion: "CABA",
    imagen: img("/paletas/p8-bullpadel-pearl-2027.webp"),
    descripcion:
      "La de Bea González recién salida. Se nota que tuvo rodaje pero está sana, sin golpes en el marco. Precio para vender ya.",
    vendedor: { nombre: "Julián", apellido: "Torres", miembroDesde: 2023 },
  },
];

// Publicaciones del usuario actual (para "Mis publicaciones")
export const MIS_PALETAS: Paleta[] = [
  {
    ...PALETAS[1],
    id: "m1",
    mia: true,
    activa: true,
    visitas: 342,
  },
  {
    ...PALETAS[4],
    id: "m2",
    mia: true,
    activa: true,
    visitas: 189,
  },
  {
    ...PALETAS[7],
    id: "m3",
    mia: true,
    activa: false,
    visitas: 521,
  },
];
