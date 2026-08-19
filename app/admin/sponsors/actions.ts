"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { exigirAdmin } from "@/lib/admin";

export type SponsorState = {
  error?: string;
  campos?: { nombre?: string; logo?: string; link?: string };
};

/**
 * exigirAdmin() al principio de CADA action, no solo en el layout: una server
 * action es un endpoint POST propio y se puede invocar sin pasar nunca por la
 * pantalla.
 */

/** El logo se ve a ~104px de ancho: mas que esto es peso que nadie mira. */
const MAX_BYTES_LOGO = 500 * 1024;

const TIPOS = ["image/webp", "image/png", "image/jpeg", "image/svg+xml"];

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
};

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refrescar() {
  revalidatePath("/admin/sponsors");
  // La tira vive en el layout de (main): la ve toda la app, no solo la home.
  revalidatePath("/", "layout");
}

/**
 * Solo http(s). Sin esto entra un `javascript:` en el href de un link que se
 * renderiza en la home para cualquier visitante.
 */
function linkValido(v: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

/** La ruta dentro del bucket a partir de la URL publica, para poder borrarla. */
function rutaDelLogo(url: string): string | null {
  const marca = "/storage/v1/object/public/sponsors/";
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}

export async function crearSponsor(
  _prev: SponsorState,
  fd: FormData,
): Promise<SponsorState> {
  await exigirAdmin();

  const nombre = texto(fd, "nombre");
  const link = texto(fd, "link");
  const orden = Number(texto(fd, "orden")) || 0;
  const logo = fd.get("logo");

  const campos: SponsorState["campos"] = {};
  if (!nombre) campos.nombre = "Poné el nombre del sponsor.";
  else if (nombre.length > 80) campos.nombre = "Máximo 80 caracteres.";

  if (link && !linkValido(link)) campos.link = "Tiene que empezar con http:// o https://";

  if (!(logo instanceof File) || logo.size === 0) {
    campos.logo = "Elegí el logo.";
  } else if (!TIPOS.includes(logo.type)) {
    campos.logo = "Tiene que ser WebP, PNG, JPG o SVG.";
  } else if (logo.size > MAX_BYTES_LOGO) {
    campos.logo = "Pesa más de 500 KB. Achicalo antes de subirlo.";
  }

  if (Object.keys(campos).length) return { campos };

  const archivo = logo as File;
  const cliente = admin();
  const ruta = `${crypto.randomUUID()}.${EXT[archivo.type]}`;

  const subida = await cliente.storage
    .from("sponsors")
    .upload(ruta, archivo, { contentType: archivo.type });
  if (subida.error) return { error: "No pudimos subir el logo. Probá de nuevo." };

  const logo_url = cliente.storage.from("sponsors").getPublicUrl(ruta).data.publicUrl;

  const { error } = await cliente
    .from("sponsors")
    .insert({ nombre, logo_url, link: link || null, orden });

  if (error) {
    // Si la fila no entra, el logo que acabamos de subir no lo referencia nadie.
    await cliente.storage.from("sponsors").remove([ruta]);
    return { error: "No pudimos guardar el sponsor. Probá de nuevo." };
  }

  refrescar();
  return {};
}

/** Reordenar. Es el unico dato que se edita sin volver a subir nada. */
export async function ordenarSponsor(fd: FormData) {
  await exigirAdmin();
  const id = texto(fd, "id");
  if (!id) return;

  const { error } = await admin()
    .from("sponsors")
    .update({ orden: Number(texto(fd, "orden")) || 0 })
    .eq("id", id);
  if (error) throw error;

  refrescar();
}

/** Sacar de la tira sin borrar: el sponsor puede volver el mes que viene. */
export async function alternarSponsor(fd: FormData) {
  await exigirAdmin();
  const id = texto(fd, "id");
  if (!id) return;

  const { error } = await admin()
    .from("sponsors")
    .update({ activo: texto(fd, "activo") === "1" })
    .eq("id", id);
  if (error) throw error;

  refrescar();
}

export async function borrarSponsor(fd: FormData) {
  await exigirAdmin();
  const id = texto(fd, "id");
  if (!id) return;

  const cliente = admin();

  // La URL primero: despues del delete no hay de donde sacarla y el logo queda
  // ocupando el bucket para siempre.
  const { data } = await cliente.from("sponsors").select("logo_url").eq("id", id).maybeSingle();

  const { error } = await cliente.from("sponsors").delete().eq("id", id);
  if (error) throw error;

  const ruta = data?.logo_url ? rutaDelLogo(data.logo_url) : null;
  if (ruta) await cliente.storage.from("sponsors").remove([ruta]);

  refrescar();
}
