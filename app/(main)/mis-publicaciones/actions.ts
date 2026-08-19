"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { BASE, armarDonacion, armarReferencia, mp } from "@/lib/mercadopago";
import {
  DURACION_DIAS,
  PLANES,
  RENOVAR_DESDE_DIAS,
  montoDonacion,
  promoVigente,
  type EstadoPublicacion,
} from "@/lib/paletas";

const enDias = (dias: number) => new Date(Date.now() + dias * 86400000).toISOString();

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

/**
 * Estira el vencimiento otros DURACION_DIAS. No acumula: vence a los 30 dias de
 * hoy, no de la fecha vieja. El filtro por vence_at es la regla de la ventana de
 * renovacion; sin el, renovar el primer dia estiraria el aviso para siempre.
 */
export async function renovar(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { supabase, uid } = await sesion();

  const { error } = await supabase
    .from("paletas")
    .update({ vence_at: enDias(DURACION_DIAS) })
    .eq("id", id)
    .eq("vendedor_id", uid)
    .lt("vence_at", enDias(RENOVAR_DESDE_DIAS));

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

  // Que sea propia, que este activa, que no este vencida y que no tenga una promo
  // corriendo. La RLS solo cubre lo primero: promocionar una pausada o una vencida
  // es pagar por algo que no se ve, y promocionar dos veces seguidas es pagar dos
  // veces lo mismo.
  const { data: paleta } = await supabase
    .from("paletas")
    .select("id, promociones (hasta)")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .eq("estado_publicacion", "activa")
    .gt("vence_at", new Date().toISOString())
    .maybeSingle();

  if (!paleta || promoVigente(paleta.promociones)) return;

  // El precio sale de PLANES: del form llega la duracion y nada mas.
  const pref = await new Preference(mp()).create({
    body: {
      items: [
        {
          id,
          title: `Paletita - Promocion ${plan.dias} dias`,
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

/**
 * Donacion opcional al marcar vendida. A diferencia de promocionar(), el monto
 * si viene del form: es una donacion, no un precio de catalogo. Por eso pasa por
 * montoDonacion(), que acota el rango.
 *
 * Quien marca la publicacion como vendida es la vuelta en /api/donacion, no esta
 * action: si el pago no se aprueba, la publicacion tiene que quedar como estaba.
 */
export async function donar(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const monto = montoDonacion(fd.get("monto"));
  if (!id || !monto) return;

  // MercadoPago rechaza las back_urls relativas con un error que no dice nada.
  if (!BASE) throw new Error("Falta NEXT_PUBLIC_BASE_URL");

  const { supabase, uid } = await sesion();

  // Que sea propia y que no este vendida ya: donar no tiene que revivir nada.
  const { data: paleta } = await supabase
    .from("paletas")
    .select("id")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .neq("estado_publicacion", "vendida")
    .maybeSingle();

  if (!paleta) return;

  const pref = await new Preference(mp()).create({
    body: {
      items: [
        {
          id: "donacion",
          title: "Donación a Paletita",
          quantity: 1,
          unit_price: monto,
          currency_id: "ARS",
        },
      ],
      external_reference: armarDonacion(id, uid),
      // Las tres a la misma puerta: el estado real lo dice MP, no la URL.
      back_urls: {
        success: `${BASE}/api/donacion`,
        failure: `${BASE}/api/donacion`,
        pending: `${BASE}/api/donacion`,
      },
      auto_return: "approved",
    },
  });

  // Fuera de cualquier try: redirect() tira a proposito.
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
