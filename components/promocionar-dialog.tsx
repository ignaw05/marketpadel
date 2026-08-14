"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUpNarrowWide, Clock, CreditCard, Star, TrendingUp } from "lucide-react";
import { promocionar } from "@/app/(main)/mis-publicaciones/actions";
import { PLANES, formatPrecio } from "@/lib/paletas";

/** El modal va en el verde de la marca; estos dos son el acento y el texto secundario. */
const LIMA = "#C7F751";
const CLARO = "rgba(255,255,255,0.78)";

/**
 * No hay fecha de fin real en el server: es urgencia visual que se renueva
 * sola cada dia, contando lo que falta para la medianoche local.
 */
function faltaParaMedianoche(): string {
  const ahora = new Date();
  const medianoche = new Date(ahora);
  medianoche.setHours(24, 0, 0, 0);
  const restante = medianoche.getTime() - ahora.getTime();
  const h = Math.floor(restante / 3_600_000);
  const m = Math.floor((restante % 3_600_000) / 60_000);
  const s = Math.floor((restante % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function BotonConfirmar({ precio }: { precio: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: LIMA, color: "#14171A", fontWeight: 700, outlineColor: LIMA }}
    >
      {pending ? "Redirigiendo…" : `Continuar al pago · ${formatPrecio(precio)}`}
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
  const [dias, setDias] = useState(30);
  const [cuenta, setCuenta] = useState(faltaParaMedianoche);
  const plan = PLANES.find((p) => p.dias === dias)!;

  useEffect(() => {
    if (auto) dialogo.current?.showModal();
  }, [auto]);

  useEffect(() => {
    const t = setInterval(() => setCuenta(faltaParaMedianoche()), 1000);
    return () => clearInterval(t);
  }, []);

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
        style={{ background: "#057305", color: "#FFFFFF" }}
      >
        <p className="text-[12px] uppercase" style={{ color: LIMA, fontWeight: 800, letterSpacing: "0.04em" }}>
          Destacá tu publicación
        </p>
        <h2 id={`promo-${id}`} className="mt-1 text-[26px] leading-tight" style={{ fontWeight: 800 }}>
          {auto ? "Publicada. ¿La destacamos?" : "Promocionar publicación"}
        </h2>

        <ul className="mt-4 space-y-2.5 text-[13px]" style={{ color: "#FFFFFF", lineHeight: 1.45 }}>
          <li className="flex gap-2">
            <ArrowUpNarrowWide size={16} className="mt-px shrink-0" style={{ color: LIMA }} aria-hidden />
            Aparece primero en el feed y en todas las búsquedas, arriba del resto.
          </li>
          <li className="flex gap-2">
            <Star size={16} className="mt-px shrink-0" style={{ color: LIMA }} aria-hidden />
            Lleva el distintivo “Destacada” sobre la foto.
          </li>
          <li className="flex gap-2">
            <TrendingUp size={16} className="mt-px shrink-0" style={{ color: LIMA }} aria-hidden />
            Multiplicá las consultas y vendé más rápido.
          </li>
        </ul>

        <div className="mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3" style={{ background: LIMA }}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#14171A" }}
          >
            <Clock size={16} style={{ color: LIMA }} aria-hidden />
          </span>
          <p className="text-[13px]" style={{ color: "#14171A" }}>
            <span className="block text-[12px] uppercase" style={{ fontWeight: 800, letterSpacing: "0.02em" }}>
              Oferta de lanzamiento · 50% OFF
            </span>
            Termina en <span style={{ fontWeight: 800 }}>{cuenta}</span>
          </p>
        </div>

        <form action={promocionar}>
          <input type="hidden" name="id" value={id} />

          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Duración de la promoción</legend>

            {PLANES.map((p) => (
              <label
                key={p.dias}
                className="relative flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.28)] px-4 py-3 has-[:checked]:border-[#C7F751] has-[:checked]:bg-[rgba(199,247,81,0.12)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                style={{ outlineColor: LIMA }}
              >
                {p.dias === 30 && (
                  <span
                    className="absolute -top-2.5 left-4 rounded-full px-2 py-0.5 text-[10px] uppercase"
                    style={{ background: LIMA, color: "#14171A", fontWeight: 800, letterSpacing: "0.02em" }}
                  >
                    Más popular
                  </span>
                )}
                {/* ponytail: el resaltado sale de has-[:checked] en CSS; el estado en React
                    es solo para reflejar el precio elegido en el boton de pago. */}
                <input
                  type="radio"
                  name="dias"
                  value={p.dias}
                  checked={dias === p.dias}
                  onChange={() => setDias(p.dias)}
                  className="peer sr-only"
                />
                <span>
                  <span className="block text-[16px]" style={{ fontWeight: 700 }}>
                    {p.dias} días
                  </span>
                  <span className="block text-[12px]" style={{ color: CLARO }}>
                    {formatPrecio(Math.round(p.precio / p.dias))} por día
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="flex items-center gap-1">
                    <span className="text-[12px] line-through" style={{ color: CLARO }}>
                      {formatPrecio(p.precioAntes)}
                    </span>
                    <span
                      className="rounded-[4px] px-1 text-[10px]"
                      style={{ background: LIMA, color: "#14171A", fontWeight: 800 }}
                    >
                      -50%
                    </span>
                  </span>
                  <span className="text-[19px]" style={{ color: LIMA, fontWeight: 800 }}>
                    {formatPrecio(p.precio)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <p
            className="mt-4 flex items-center gap-1.5 rounded-[10px] px-3 py-2.5 text-[12px]"
            style={{ background: "rgba(255,255,255,0.08)", color: CLARO }}
          >
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
            <BotonConfirmar precio={plan.precio} />
          </div>
        </form>
      </dialog>
    </>
  );
}
