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

export const MARCAS = [
  "Bullpadel",
  "Nox",
  "Adidas",
  "Head",
  "Babolat",
  "Wilson",
  "Siux",
  "StarVie",
  "Drop Shot",
  "Royal Padel",
  "Vibor-A",
  "Varlion",
];

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

export const ANIOS = [2025, 2024, 2023, 2022, 2021, 2020];

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
    id: "p1",
    marca: "Bullpadel",
    modelo: "Vertex 04 Comfort",
    forma: "Diamante",
    anio: 2024,
    estado: 9,
    precio: 420000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("https://images.unsplash.com/photo-1615326882458-e0d45b097f55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "La usé una temporada, sin roturas ni golpes en el marco. Salió muy potente, ideal para pegador. Va con paletero original.",
    vendedor: { nombre: "Martín", apellido: "Gómez", miembroDesde: 2024 },
  },
  {
    id: "p2",
    marca: "Nox",
    modelo: "AT10 Genius 18K",
    forma: "Lágrima",
    anio: 2023,
    estado: 8,
    precio: 385000,
    provincia: "CABA",
    ciudad: "CABA",
    ubicacion: "CABA",
    imagen: img("https://images.unsplash.com/photo-1613586516733-1cb124e3b025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Impecable, la de Agustín Tapia. Muy buen control y salida de bola. Tiene un par de detalles estéticos en el canto, nada que afecte el juego.",
    vendedor: { nombre: "Lucía", apellido: "Fernández", miembroDesde: 2023 },
  },
  {
    id: "p3",
    marca: "Adidas",
    modelo: "Metalbone 3.3",
    forma: "Diamante",
    anio: 2024,
    estado: 9,
    precio: 450000,
    provincia: "Santa Fe",
    ciudad: "Rosario",
    ubicacion: "Rosario",
    imagen: img("https://images.unsplash.com/photo-1646649853703-7645147474ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "La de Galán, un fierro. Casi sin uso, la compré y jugué muy pocas veces. Puños de sobra incluidos.",
    vendedor: { nombre: "Nicolás", apellido: "Pérez", miembroDesde: 2024 },
  },
  {
    id: "p4",
    marca: "Head",
    modelo: "Delta Pro",
    forma: "Diamante",
    anio: 2023,
    estado: 7,
    precio: 240000,
    provincia: "Córdoba",
    ciudad: "Córdoba",
    ubicacion: "Córdoba",
    imagen: img("https://images.unsplash.com/photo-1728034262202-0c3badbc3fcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Buena paleta para nivel intermedio-avanzado. Se nota el uso pero anda joya, sin roturas. La vendo porque cambié de forma.",
    vendedor: { nombre: "Diego", apellido: "Sosa", miembroDesde: 2022 },
  },
  {
    id: "p5",
    marca: "Babolat",
    modelo: "Technical Viper",
    forma: "Diamante",
    anio: 2023,
    estado: 8,
    precio: 310000,
    provincia: "Buenos Aires",
    ciudad: "La Plata",
    ubicacion: "La Plata",
    imagen: img("https://images.unsplash.com/photo-1646649853517-e2f75cde1908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Muy buena, la de Lebrón. Tiene rugosidad para dar efecto. Marco sano, solo detalles mínimos de pintura.",
    vendedor: { nombre: "Sofía", apellido: "Romero", miembroDesde: 2023 },
  },
  {
    id: "p6",
    marca: "Siux",
    modelo: "Electra ST3 Stupa",
    forma: "Lágrima",
    anio: 2024,
    estado: 10,
    precio: 395000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("https://images.unsplash.com/photo-1672223304816-d96242210bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Sin uso, la regalaron y no juego. Todavía tiene el plástico en el puño. Entrego con factura.",
    vendedor: { nombre: "Tomás", apellido: "Álvarez", miembroDesde: 2024 },
  },
  {
    id: "p7",
    marca: "StarVie",
    modelo: "Metheora Warrior",
    forma: "Redonda",
    anio: 2022,
    estado: 7,
    precio: 195000,
    provincia: "Buenos Aires",
    ciudad: "Mar del Plata",
    ubicacion: "Mar del Plata",
    imagen: img("https://images.unsplash.com/photo-1672223303531-84de406fb2d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Redonda muy cómoda para salir de la pared. La usé dos temporadas, anda perfecto. Ideal para arrancar en serio.",
    vendedor: { nombre: "Valentina", apellido: "Díaz", miembroDesde: 2021 },
  },
  {
    id: "p8",
    marca: "Wilson",
    modelo: "Bela Pro V2.5",
    forma: "Lágrima",
    anio: 2023,
    estado: 8,
    precio: 275000,
    provincia: "CABA",
    ciudad: "CABA",
    ubicacion: "CABA",
    imagen: img("https://images.unsplash.com/photo-1646651105426-e8c8ee9badde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "La de Fede Chingotto. Balance perfecto entre control y potencia. Muy cuidada, sin golpes en el marco.",
    vendedor: { nombre: "Julián", apellido: "Torres", miembroDesde: 2023 },
  },
  {
    id: "p9",
    marca: "Drop Shot",
    modelo: "Conqueror 12",
    forma: "Diamante",
    anio: 2024,
    estado: 9,
    precio: 330000,
    provincia: "Neuquén",
    ciudad: "Neuquén",
    ubicacion: "Neuquén",
    imagen: img("https://images.unsplash.com/photo-1646651105454-6c167ea6f83b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Como nueva, poquísimo uso. Muy potente para el remate. La vendo porque me pasé a una lágrima.",
    vendedor: { nombre: "Camila", apellido: "Vega", miembroDesde: 2024 },
  },
  {
    id: "p10",
    marca: "Nox",
    modelo: "ML10 Pro Cup",
    forma: "Redonda",
    anio: 2023,
    estado: 8,
    precio: 260000,
    provincia: "Tucumán",
    ciudad: "San Miguel de Tucumán",
    ubicacion: "Tucumán",
    imagen: img("https://images.unsplash.com/photo-1646649852046-b758d2d573f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "La de Miguel Lamperti, un clásico. Redonda muy manejable, tacto de goma buenísimo. En muy buen estado.",
    vendedor: { nombre: "Franco", apellido: "Molina", miembroDesde: 2022 },
  },
  {
    id: "p11",
    marca: "Royal Padel",
    modelo: "Whip Polietileno",
    forma: "Lágrima",
    anio: 2022,
    estado: 6,
    precio: 165000,
    provincia: "Salta",
    ciudad: "Salta",
    ubicacion: "Salta",
    imagen: img("https://images.unsplash.com/photo-1646649851780-d9701b7c3c04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Usada pero con mucha vida por delante. Goma de polietileno, dura un montón. Precio charlable para el que la venga a ver.",
    vendedor: { nombre: "Rodrigo", apellido: "Ibáñez", miembroDesde: 2021 },
  },
  {
    id: "p12",
    marca: "Vibor-A",
    modelo: "Yarara Edition",
    forma: "Lágrima",
    anio: 2024,
    estado: 9,
    precio: 355000,
    provincia: "Mendoza",
    ciudad: "Mendoza",
    ubicacion: "Mendoza",
    imagen: img("https://images.unsplash.com/photo-1658723826297-fe4d1b1e6600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"),
    descripcion:
      "Espectacular, muy poco uso. Salida de bola cómoda y buen punch en el remate. Va con protector puesto desde el día uno.",
    vendedor: { nombre: "Agustina", apellido: "Ruiz", miembroDesde: 2024 },
  },
];

// Publicaciones del usuario actual (para "Mis publicaciones")
export const MIS_PALETAS: Paleta[] = [
  {
    ...PALETAS[0],
    id: "m1",
    mia: true,
    activa: true,
    visitas: 342,
  },
  {
    ...PALETAS[5],
    id: "m2",
    mia: true,
    activa: true,
    visitas: 189,
  },
  {
    ...PALETAS[8],
    id: "m3",
    mia: true,
    activa: false,
    visitas: 521,
  },
];
