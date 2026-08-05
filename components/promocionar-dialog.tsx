"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Star, TrendingUp } from "lucide-react";
import { promocionar } from "@/app/(main)/mis-publicaciones/actions";
import { PLANES, formatPrecio } from "@/lib/paletas";

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
    >
      {pending ? "Redirigiendo…" : "Continuar al pago"}
    </button>
  );
}

/** `className` es del boton que abre: cada pantalla le da su forma (chip o boton ancho). */
export function PromocionarDialog({
  id,
  titulo,
  className,
}: {
  id: string;
  titulo: string;
  className: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => dialogo.current?.showModal()} className={className}>
        <Star size={14} aria-hidden /> Promocionar
        <span className="sr-only"> {titulo}</span>
      </button>

      {/* ponytail: <dialog> nativo. Trae foco atrapado, Escape y backdrop sin JS.
          m-auto porque el preflight de Tailwind pone margin:0 en todo y le come
          el margin:auto con el que el navegador centra un dialog modal. */}
      <dialog
        ref={dialogo}
        aria-labelledby={`promo-${id}`}
        className="m-auto w-[min(400px,calc(100vw-2rem))] rounded-[14px] p-6 backdrop:bg-[rgba(20,23,26,0.45)]"
        style={{ background: "#FFFFFF", color: "#14171A" }}
      >
        <h2 id={`promo-${id}`} style={{ fontWeight: 700, fontSize: 18 }}>
          Promocionar publicación
        </h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
          “{titulo}” aparece entre los primeros resultados de todas las búsquedas mientras dure la
          promoción.
        </p>

        <form action={promocionar}>
          <input type="hidden" name="id" value={id} />

          <fieldset className="mt-5 space-y-2.5">
            <legend className="sr-only">Duración de la promoción</legend>

            {PLANES.map((plan) => (
              <label
                key={plan.dias}
                className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-[#E6E4DF] px-3.5 py-2.5 has-[:checked]:border-[#0F5132] has-[:checked]:bg-[rgba(15,81,50,0.06)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                style={{ outlineColor: "#0F5132" }}
              >
                {/* ponytail: el resaltado sale de has-[:checked] en CSS, sin estado de React. */}
                <input
                  type="radio"
                  name="dias"
                  value={plan.dias}
                  defaultChecked={plan.dias === 30}
                  className="peer sr-only"
                />
                {/* peer-checked solo alcanza a hermanos del input, por eso va aca y se hereda. */}
                <span className="peer-checked:text-[#0F5132]">
                  <span className="block text-[15px]" style={{ fontWeight: 700 }}>
                    {plan.dias} días
                  </span>
                  <span className="block text-[12px]" style={{ color: "#5B6470" }}>
                    {formatPrecio(Math.round(plan.precio / plan.dias))} por día
                  </span>
                </span>
                <span className="text-[17px]" style={{ color: "#0F5132", fontWeight: 800 }}>
                  {formatPrecio(plan.precio)}
                </span>
              </label>
            ))}
          </fieldset>

          <p
            className="mt-3 flex items-center gap-1.5 text-[12px]"
            style={{ color: "#5B6470" }}
          >
            <TrendingUp size={13} aria-hidden /> Al terminar el período vuelve al orden normal.
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px]" style={{ color: "#5B6470" }}>
            <CreditCard size={13} aria-hidden /> Te llevamos a MercadoPago para pagar.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: "#FAFAF8",
                border: "1px solid #E6E4DF",
                color: "#14171A",
                fontWeight: 600,
                outlineColor: "#0F5132",
              }}
            >
              Cancelar
            </button>
            <BotonConfirmar />
          </div>
        </form>
      </dialog>
    </>
  );
}
