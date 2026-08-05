"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoPublicacion } from "@/lib/paletas";

const ESTADOS_VALIDOS: EstadoPublicacion[] = ["activa", "pausada", "vendida"];

/** RLS ya limita a las propias; igual filtramos por vendedor para no depender solo de eso. */
async function sesion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión vencida");
  return { supabase, uid: user.id };
}

export async function cambiarEstado(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const estado = String(fd.get("estado") ?? "") as EstadoPublicacion;
  if (!id || !ESTADOS_VALIDOS.includes(estado)) return;

  const { supabase, uid } = await sesion();

  const { error } = await supabase
    .from("paletas")
    .update({ estado_publicacion: estado })
    .eq("id", id)
    .eq("vendedor_id", uid);

  if (error) throw error;

  revalidatePath("/mis-publicaciones");
  revalidatePath("/");
}

export async function eliminar(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { supabase, uid } = await sesion();

  const { data: paleta } = await supabase
    .from("paletas")
    .select("fotos")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .maybeSingle();

  const { error } = await supabase
    .from("paletas")
    .delete()
    .eq("id", id)
    .eq("vendedor_id", uid);

  if (error) throw error;

  // Las fotos no se borran solas con la fila: quedarian ocupando el bucket.
  const rutas = (paleta?.fotos ?? [])
    .map((url: string) => url.split("/paletas/").pop())
    .filter((r: string | undefined): r is string => !!r);

  if (rutas.length) await supabase.storage.from("paletas").remove(rutas);

  revalidatePath("/mis-publicaciones");
  revalidatePath("/");
}
