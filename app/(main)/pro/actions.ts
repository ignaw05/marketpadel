"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { BASE, armarSuscripcion, mp } from "@/lib/mercadopago";
import { miPlan } from "@/lib/pro-db";
import { PLAN_PRO, creditosRestantes } from "@/lib/pro";
import { promoVigente } from "@/lib/paletas";

/** RLS ya limita a lo propio; igual filtramos por vendedor para no depender solo de eso. */
async function sesion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión vencida");
  return { supabase, uid: user.id };
}

/**
 * Pago del plan. Quien activa la suscripcion es el webhook, no la vuelta del
 * navegador: el usuario puede cerrarlo antes de volver.
 *
 * ponytail: pago unico mensual, sin debito automatico. El preapproval de MP es
 * otro flujo del SDK y otro tipo de notificacion; si perseguir renovaciones a
 * mano se vuelve el cuello de botella, ahi entra.
 */
export async function suscribirPro() {
  // MercadoPago rechaza las back_urls relativas con un error que no dice nada.
  if (!BASE) throw new Error("Falta NEXT_PUBLIC_BASE_URL");

  const { uid } = await sesion();

  // El precio sale de PLAN_PRO: del form no llega nada.
  const pref = await new Preference(mp()).create({
    body: {
      items: [
        {
          id: "pro",
          title: `Paletita - Vendedor Pro ${PLAN_PRO.dias} dias`,
          quantity: 1,
          unit_price: PLAN_PRO.precio,
          currency_id: "ARS",
        },
      ],
      external_reference: armarSuscripcion(uid),
      back_urls: {
        success: `${BASE}/cuenta?pro=exito`,
        failure: `${BASE}/cuenta?pro=error`,
        pending: `${BASE}/cuenta?pro=pendiente`,
      },
      auto_return: "approved",
      notification_url: `${BASE}/api/mercadopago/webhook`,
    },
  });

  // Fuera de cualquier try: redirect() tira a proposito.
  redirect(pref.init_point!);
}

/**
 * Canjea uno de los 3 creditos del periodo por una promocion de 15 dias.
 *
 * No necesita service role: la policy `promociones_premium` (0001) deja al
 * vendedor insertar sobre su propia paleta con su propia suscripcion, y el
 * trigger `promociones_validar` corta el cuarto credito en la base. Esto solo
 * traduce el resultado a un mensaje.
 */
export async function usarCredito(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) return;

  const { supabase, uid } = await sesion();

  const plan = await miPlan();
  if (!plan.suscripcionId) redirect("/pro");
  if (creditosRestantes(plan.usados) <= 0) redirect("/mis-publicaciones?credito=sin-creditos");

  // Que sea propia, que este activa, que no este vencida y que no tenga una
  // promo corriendo. Mismo bloque que promocionar(): gastar un credito sobre una
  // pausada o sobre una que ya esta promocionada es tirarlo a la basura.
  const { data: paleta } = await supabase
    .from("paletas")
    .select("id, promociones (hasta)")
    .eq("id", id)
    .eq("vendedor_id", uid)
    .eq("estado_publicacion", "activa")
    .gt("vence_at", new Date().toISOString())
    .maybeSingle();

  if (!paleta || promoVigente(paleta.promociones)) {
    redirect("/mis-publicaciones?credito=error");
  }

  const hasta = new Date(Date.now() + PLAN_PRO.diasPromo * 86400000).toISOString();

  const { error } = await supabase.from("promociones").insert({
    paleta_id: id,
    origen: "premium",
    suscripcion_id: plan.suscripcionId,
    hasta,
  });

  // El trigger de la base tira 'sin creditos' si dos pestañas canjean a la vez.
  if (error) {
    console.error("usarCredito:", error);
    redirect("/mis-publicaciones?credito=sin-creditos");
  }

  revalidatePath("/mis-publicaciones");
  revalidatePath("/vendedores");
  revalidatePath("/");
  redirect("/mis-publicaciones?credito=exito");
}
