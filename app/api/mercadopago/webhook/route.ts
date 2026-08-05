import { revalidatePath } from "next/cache";
import { Payment } from "mercadopago";
import { firmaValida, leerReferencia, mp, traducirEstado } from "@/lib/mercadopago";
import { admin } from "@/lib/supabase/admin";
import { PLANES } from "@/lib/paletas";

/**
 * Lo unico que confirma un pago. La back_url a la que vuelve el navegador no
 * confirma nada: el usuario puede cerrarlo antes, o abrirla a mano.
 *
 * Devuelve 200 siempre, salvo firma invalida: cualquier otra cosa le dispara
 * reintentos a MercadoPago durante dias.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);

  // MP tambien notifica merchant_order y demas; solo nos interesan los pagos.
  if (url.searchParams.get("type") !== "payment") return new Response(null, { status: 200 });

  const dataId = url.searchParams.get("data.id") ?? "";
  const ok = firmaValida({
    dataId,
    requestId: req.headers.get("x-request-id") ?? "",
    firma: req.headers.get("x-signature") ?? "",
    secreto: process.env.MP_WEBHOOK_SECRET ?? "",
  });
  if (!ok) return new Response("unauthorized", { status: 401 });

  try {
    // El body solo trae el id. El estado se le pregunta a la API de MP.
    const pago = await new Payment(mp()).get({ id: dataId });

    const ref = leerReferencia(pago.external_reference);
    if (!ref) return new Response(null, { status: 200 });

    const monto = Math.round(pago.transaction_amount ?? 0);
    if (monto <= 0) {
      console.error("webhook MP: pago sin monto", { dataId });
      return new Response(null, { status: 200 });
    }

    // El monto no puede venir del plan: hay que verificar lo que MP cobro de verdad.
    const plan = PLANES.find((p) => p.dias === ref.dias);
    const promocionar = monto === plan?.precio;
    if (!promocionar) {
      console.error("webhook MP: el monto no coincide con ningun plan", {
        dataId,
        dias: ref.dias,
        monto,
      });
    }

    const { data: resultado, error } = await admin().rpc("registrar_promocion_pagada", {
      p_mp_payment_id: String(pago.id),
      p_paleta_id: ref.paletaId,
      p_dias: ref.dias,
      p_monto: monto,
      p_estado: traducirEstado(pago.status),
      p_promocionar: promocionar,
    });

    if (error) throw error;

    if (resultado === "promocionada") {
      revalidatePath("/");
      revalidatePath("/mis-publicaciones");
      revalidatePath(`/paletas/${ref.paletaId}`);
    }
  } catch (e) {
    // Loguear y devolver 200 igual: el reintento de MP volveria a fallar.
    console.error("webhook MP:", e);
  }

  return new Response(null, { status: 200 });
}
