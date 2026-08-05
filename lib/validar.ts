// Validacion pura, sin FormData ni base: es lo que se testea.
// El server action parsea el form y llama a estas funciones.
import { FORMAS, PROVINCIAS } from "@/lib/paletas";

export const MAX_FOTOS = 4;
export const MAX_BYTES = 5 * 1024 * 1024;

export type CampoPaleta =
  | "marca_id"
  | "modelo"
  | "forma"
  | "anio"
  | "estado"
  | "precio"
  | "provincia"
  | "ciudad"
  | "descripcion"
  | "fotos";

export type DatosPaleta = {
  marca_id: number;
  modelo: string;
  forma: string;
  anio: number;
  estado: number;
  precio: number;
  provincia: string;
  ciudad: string;
  descripcion: string;
  fotos: { tipo: string; bytes: number }[];
};

export type Errores<C extends string> = Partial<Record<C, string>>;

export function validarPaleta(
  d: DatosPaleta,
  anioActual = new Date().getFullYear(),
): Errores<CampoPaleta> {
  const e: Errores<CampoPaleta> = {};

  if (!d.marca_id) e.marca_id = "Elegí una marca.";
  if (!d.modelo) e.modelo = "Escribí el modelo.";
  else if (d.modelo.length > 120) e.modelo = "Máximo 120 caracteres.";

  if (!FORMAS.includes(d.forma as never)) e.forma = "Elegí una forma.";
  if (!d.anio || d.anio < 2000 || d.anio > anioActual + 1)
    e.anio = "Elegí un año válido.";
  if (!d.estado || d.estado < 1 || d.estado > 10) e.estado = "El estado va de 1 a 10.";
  if (!d.precio || d.precio <= 0) e.precio = "Escribí un precio mayor a cero.";
  if (!PROVINCIAS.includes(d.provincia)) e.provincia = "Elegí una provincia.";
  if (!d.ciudad) e.ciudad = "Escribí la ciudad.";

  if (!d.descripcion) e.descripcion = "Contá cómo está la paleta.";
  else if (d.descripcion.length > 300) e.descripcion = "Máximo 300 caracteres.";

  if (d.fotos.length === 0) e.fotos = "Subí al menos una foto.";
  else if (d.fotos.length > MAX_FOTOS) e.fotos = `Máximo ${MAX_FOTOS} fotos.`;
  else if (d.fotos.some((f) => !f.tipo.startsWith("image/")))
    e.fotos = "Solo se pueden subir imágenes.";
  else if (d.fotos.some((f) => f.bytes > MAX_BYTES))
    e.fotos = "Cada foto tiene que pesar menos de 5 MB.";

  return e;
}

export type CampoAuth = "email" | "password" | "nombre" | "apellido" | "whatsapp";

export function validarAuth(
  d: { email: string; password: string; nombre: string; apellido: string },
  modo: "login" | "registro",
): Errores<CampoAuth> {
  const e: Errores<CampoAuth> = {};

  if (!d.email) e.email = "Escribí tu email.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email))
    e.email = "Ese email no parece válido.";

  if (!d.password) e.password = "Escribí tu contraseña.";
  else if (modo === "registro" && d.password.length < 8)
    e.password = "Mínimo 8 caracteres.";

  if (modo === "registro") {
    if (!d.nombre) e.nombre = "Escribí tu nombre.";
    if (!d.apellido) e.apellido = "Escribí tu apellido.";
  }

  return e;
}

/**
 * PostgREST separa los filtros de .or() con comas y parentesis. Si van en el
 * texto que escribio el usuario, rompen la query o cambian lo que filtra.
 */
export const limpiarBusqueda = (q: string) => q.replace(/[,().*]/g, " ").trim();
