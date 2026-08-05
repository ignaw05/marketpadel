"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { BASE, armarReferencia, mp } from "@/lib/mercadopago";
import { PLANES, promoVigente, type EstadoPublicacion } from "@/lib/paletas";

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

  // MercadoPago rechaza las back_urls relativas con un error que no dice nada.
  if (!BASE) throw new Error("Falta NEXT_PUBLIC_BASE_URL");

  const { supabase, uid } = await sesion();

  // Que sea propia, que este activa y que no tenga una promo corriendo. La RLS
  // solo cubre lo primero: promocionar una pausada no la muestra en ningun lado,
  // y promocionar dos veces seguidas seria pagar dos veces por lo mismo.
  const { data: paleta } = await supabase
    .from("paletas")
    .select("id, modelo, promociones (hasta), marcas (nombre)")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .eq("estado_publicacion", "activa")
    .maybeSingle();

  if (!paleta || promoVigente(paleta.promociones)) return;

  // El titulo que ve el comprador en MercadoPago sale de la base, no del form.
  const marca = (paleta.marcas as unknown as { nombre: string } | null)?.nombre ?? "";

  // El precio sale de PLANES: del form llega la duracion y nada mas.
  const pref = await new Preference(mp()).create({
    body: {
      items: [
        {
          id,
          title: `Promocionar ${marca} ${paleta.modelo} por ${plan.dias} días`,
          quantity: 1,
          unit_price: plan.precio,
          currency_id: "ARS",
        },
      ],
      external_reference: armarReferencia(id, plan.dias),
      back_urls: {
        success: `${BASE}/mis-publicaciones?pago=exito`,
        failure: `${BASE}/mis-publicaciones?pago=error`,
        pending: `${BASE}/mis-publicaciones?pago=pendiente`,
      },
      auto_return: "approved",
      notification_url: `${BASE}/api/mercadopago/webhook`,
    },
  });

  // Quien promociona es el webhook, no esta pantalla: el usuario puede cerrar el
  // navegador antes de volver. Fuera de cualquier try, redirect() tira a proposito.
  redirect(pref.init_point!);
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
