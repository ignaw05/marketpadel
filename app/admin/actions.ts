"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { exigirAdmin } from "@/lib/admin";

/**
 * exigirAdmin() al principio de CADA action, no solo en el layout: una server
 * action es un endpoint POST propio y se puede invocar sin pasar nunca por la
 * pantalla. Si falta el gate, cualquiera banea a cualquiera.
 */

function refrescar() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
}

/** Baja de moderacion: sale del feed y de Mis publicaciones, pero no se borra. */
export async function bajarPublicacion(fd: FormData) {
  await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { error } = await admin()
    .from("paletas")
    .update({ estado_publicacion: "eliminada" })
    .eq("id", id);
  if (error) throw error;

  refrescar();
}

export async function reactivarPublicacion(fd: FormData) {
  await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { error } = await admin()
    .from("paletas")
    .update({ estado_publicacion: "activa" })
    .eq("id", id);
  if (error) throw error;

  refrescar();
}

/** 100 años. El Admin API de Supabase no tiene un baneo sin fecha de fin. */
const PARA_SIEMPRE = "876000h";

export async function banear(fd: FormData) {
  const yo = await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  // Banearse a uno mismo deja el panel sin nadie que lo pueda deshacer.
  if (!id || id === yo.id) return;

  const cliente = admin();

  // Baneo nativo de auth: le corta el login y le invalida los refresh tokens.
  const { error } = await cliente.auth.admin.updateUserById(id, {
    ban_duration: PARA_SIEMPRE,
  });
  if (error) throw error;

  // El baneo no toca lo ya publicado: sin esto sus paletas siguen en el feed
  // hasta que venzan. Las vendidas se dejan como estan, son historia.
  const baja = await cliente
    .from("paletas")
    .update({ estado_publicacion: "eliminada" })
    .eq("vendedor_id", id)
    .in("estado_publicacion", ["activa", "pausada"]);
  if (baja.error) throw baja.error;

  refrescar();
}

export async function desbanear(fd: FormData) {
  await exigirAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { error } = await admin().auth.admin.updateUserById(id, {
    ban_duration: "none",
  });
  if (error) throw error;

  // ponytail: no reactiva las publicaciones. No hay forma de distinguir las que
  // bajo el baneo de las que se bajaron de a una, y reactivar contenido que se
  // modero aparte seria peor. La fila del usuario linkea a sus publicaciones
  // para reactivar las que correspondan.
  refrescar();
}
