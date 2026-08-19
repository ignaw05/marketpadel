import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Payment } from "mercadopago";
import { leerDonacion, mp, traducirEstado } from "@/lib/mercadopago";
import { admin } from "@/lib/supabase/admin";

/**
 * Vuelta de MercadoPago despues de una donacion. Route handler y no la page
 * porque aca hay escrituras y un render se re-ejecuta solo.
 *
 * Lo unico que llega del navegador es `payment_id`: el monto, el estado y de
 * quien es la publicacion salen de la API de MP. Una URL falseada no registra
 * una donacion inventada ni marca vendida una paleta ajena.
 *
 * ponytail: sin webhook. Quien cierra el navegador antes de volver deja la
 * donacion sin registrar y la publicacion sin marcar (la puede marcar a mano);
 * la plata llega igual y queda en el panel de MP. Agregar el webhook el dia que
 * `pagos` tenga que cuadrar con MP o se muestre un total recaudado en la app.
 */
export async function GET(req: Request) {
  const paymentId = new URL(req.url).searchParams.get("payment_id") ?? "";
  let resultado = "error";

  try {
    const pago = await new Payment(mp()).get({ id: paymentId });
    const ref = leerDonacion(pago.external_reference);
    const monto = Math.round(pago.transaction_amount ?? 0);
    const estado = traducirEstado(pago.status);

    if (ref && monto > 0) {
      // ignoreDuplicates sobre mp_payment_id: recargar esta URL no duplica la fila.
      const { error } = await admin()
        .from("pagos")
        .upsert(
          {
            perfil_id: ref.vendedorId,
            mp_payment_id: String(pago.id),
            monto,
            estado,
            concepto: "donacion",
            external_reference: pago.external_reference,
          },
          { onConflict: "mp_payment_id", ignoreDuplicates: true },
        );
      if (error) throw error;

      if (estado === "aprobado") {
        // El vendedor sale del external_reference, que lo escribio el server al
        // crear la preferencia. El filtro es cinturon y tiradores.
        const { error: e } = await admin()
          .from("paletas")
          .update({ estado_publicacion: "vendida" })
          .eq("id", ref.paletaId)
          .eq("vendedor_id", ref.vendedorId);
        if (e) throw e;

        resultado = "exito";
      } else {
        // traducirEstado manda lo desconocido a "pendiente"; rechazado y devuelto
        // no son una espera, son un no.
        resultado = estado === "pendiente" ? "pendiente" : "error";
      }
    }
  } catch (e) {
    // El usuario ya pago: no puede caer en una pantalla de error del framework.
    console.error("vuelta de donacion:", e);
  }

  revalidatePath("/mis-publicaciones");
  revalidatePath("/");

  // Fuera del try: redirect() tira a proposito.
  redirect(`/mis-publicaciones?donacion=${resultado}`);
}
