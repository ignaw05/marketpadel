"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUpNarrowWide, CreditCard, Star, TrendingUp } from "lucide-react";
import { promocionar } from "@/app/(main)/mis-publicaciones/actions";
import { PLANES, formatPrecio } from "@/lib/paletas";

/** El modal va en el verde de la marca; estos dos son el acento y el texto secundario. */
const LIMA = "#C7F751";
const CLARO = "rgba(255,255,255,0.78)";

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: LIMA, color: "#14171A", fontWeight: 700, outlineColor: LIMA }}
    >
      {pending ? "Redirigiendo…" : "Continuar al pago"}
    </button>
  );
}

/**
 * `className` es del boton que abre: cada pantalla le da su forma (chip o boton ancho).
 * `auto` lo abre solo al montar; es la invitacion de recien publicada. El chip
 * sigue estando abajo, asi que cerrar no deja al usuario sin la puerta.
 */
export function PromocionarDialog({
  id,
  titulo,
  className,
  auto = false,
}: {
  id: string;
  titulo: string;
  className: string;
  auto?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (auto) dialogo.current?.showModal();
  }, [auto]);

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
        className="m-auto w-[min(400px,calc(100vw-2rem))] rounded-[14px] p-6 backdrop:bg-[rgba(20,23,26,0.6)]"
        style={{ background: "#0F5132", color: "#FFFFFF" }}
      >
        <h2 id={`promo-${id}`} style={{ fontWeight: 700, fontSize: 18 }}>
          {auto ? "Publicada. ¿La destacamos?" : "Promocionar publicación"}
        </h2>
        <p className="mt-1.5 text-[14px]" style={{ color: CLARO, lineHeight: 1.5 }}>
          Mientras dure la promoción, “{titulo}”:
        </p>

        <ul className="mt-3 space-y-2 text-[13px]" style={{ color: "#FFFFFF", lineHeight: 1.45 }}>
          <li className="flex gap-2">
            <ArrowUpNarrowWide size={16} className="mt-px shrink-0" style={{ color: LIMA }} aria-hidden />
            Aparece primero en el feed y en todas las búsquedas, arriba del resto.
          </li>
          <li className="flex gap-2">
            <Star size={16} className="mt-px shrink-0" style={{ color: LIMA }} aria-hidden />
            Lleva el distintivo “Destacada” sobre la foto.
          </li>
        </ul>

        <form action={promocionar}>
          <input type="hidden" name="id" value={id} />

          <fieldset className="mt-5 space-y-2.5">
            <legend className="sr-only">Duración de la promoción</legend>

            {PLANES.map((plan) => (
              <label
                key={plan.dias}
                className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-[rgba(255,255,255,0.28)] px-3.5 py-2.5 has-[:checked]:border-[#C7F751] has-[:checked]:bg-[rgba(199,247,81,0.12)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                style={{ outlineColor: LIMA }}
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
                <span>
                  <span className="block text-[15px]" style={{ fontWeight: 700 }}>
                    {plan.dias} días
                  </span>
                  <span className="block text-[12px]" style={{ color: CLARO }}>
                    {formatPrecio(Math.round(plan.precio / plan.dias))} por día
                  </span>
                </span>
                <span className="text-[17px]" style={{ color: LIMA, fontWeight: 800 }}>
                  {formatPrecio(plan.precio)}
                </span>
              </label>
            ))}
          </fieldset>

          <p
            className="mt-3 flex items-center gap-1.5 text-[12px]"
            style={{ color: CLARO }}
          >
            <TrendingUp size={13} aria-hidden /> Al terminar el período vuelve al orden normal.
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px]" style={{ color: CLARO }}>
            <CreditCard size={13} aria-hidden /> Te llevamos a MercadoPago para pagar.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#FFFFFF",
                fontWeight: 600,
                outlineColor: LIMA,
              }}
            >
              {auto ? "Ahora no" : "Cancelar"}
            </button>
            <BotonConfirmar />
          </div>
        </form>
      </dialog>
    </>
  );
}
