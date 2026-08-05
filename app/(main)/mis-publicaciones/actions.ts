"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PLANES, promoVigente, vencimiento, type EstadoPublicacion } from "@/lib/paletas";

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

export async function promocionar(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const plan = PLANES.find((p) => p.dias === Number(fd.get("dias")));
  if (!id || !plan) return;

  const { supabase, uid } = await sesion();

  // Que sea propia, que este activa y que no tenga una promo corriendo. La RLS
  // solo cubre lo primero: promocionar una pausada no la muestra en ningun lado,
  // y promocionar dos veces seguidas seria pagar dos veces por lo mismo.
  const { data: paleta } = await supabase
    .from("paletas")
    .select("id, promociones (hasta)")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .eq("estado_publicacion", "activa")
    .maybeSingle();

  if (!paleta || promoVigente(paleta.promociones)) return;

  // ponytail: sin cobrar. Con MercadoPago esto pasa a hacerlo el webhook, con
  // origen 'individual' y el pago_id de la preferencia aprobada.
  const { error } = await supabase.from("promociones").insert({
    paleta_id: id,
    origen: "cortesia",
    hasta: vencimiento(plan.dias).toISOString(),
  });

  if (error) throw error;

  revalidatePath("/mis-publicaciones");
  revalidatePath("/");
  revalidatePath(`/paletas/${id}`);
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
