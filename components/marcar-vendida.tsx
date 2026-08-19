"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, CreditCard, Heart } from "lucide-react";
import { cambiarEstado, donar } from "@/app/(main)/mis-publicaciones/actions";
import {
  MONTOS_DONACION,
  MONTO_DONACION_MAX,
  MONTO_DONACION_MIN,
  formatPrecio,
  montoDonacion,
} from "@/lib/paletas";

const VERDE = "#057305";
const BORDE = "1px solid #E6E4DF";

/** El chip de la fila. Ya no envia nada: abre el dialogo. */
function Chip({ titulo, onClick }: { titulo: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: VERDE, fontWeight: 600, outlineColor: VERDE }}
    >
      <CheckCircle2 size={11} aria-hidden />
      La vendí
      <span className="sr-only"> — {titulo}</span>
    </button>
  );
}

function BotonDonar({ monto }: { monto: number | null }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || monto === null}
      className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[14px] px-4 py-2.5 text-[14px] text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: VERDE, fontWeight: 700, outlineColor: VERDE }}
    >
      <Heart size={15} aria-hidden />
      {pending
        ? "Redirigiendo…"
        : monto === null
          ? "Donar y marcar vendida"
          : `Donar ${formatPrecio(monto)} y marcar vendida`}
    </button>
  );
}

function BotonSinDonar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] w-full rounded-[14px] px-4 py-2.5 text-[14px] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#FAFAF8", border: BORDE, color: "#14171A", fontWeight: 600, outlineColor: VERDE }}
    >
      {pending ? "Marcando…" : "Marcar vendida sin donar"}
    </button>
  );
}

const opcionClass =
  "flex min-h-[44px] cursor-pointer items-center justify-center rounded-[12px] px-3 py-2 text-[14px] border border-[#E6E4DF] has-[:checked]:border-[#057305] has-[:checked]:bg-[rgba(5,115,5,0.08)] has-[:checked]:text-[#057305] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

/**
 * Marcar vendida es lo que el usuario vino a hacer, y sigue siendo gratis: el
 * boton "sin donar" esta a la vista, no escondido detras de un link chiquito.
 */
export function MarcarVendida({ id, titulo }: { id: string; titulo: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [elegido, setElegido] = useState<number | "otro">(MONTOS_DONACION[1]);
  const [otro, setOtro] = useState("");

  const monto = elegido === "otro" ? montoDonacion(otro) : elegido;

  useEffect(() => {
    if (elegido === "otro") campo.current?.focus();
  }, [elegido]);

  return (
    <>
      <Chip titulo={titulo} onClick={() => dialogo.current?.showModal()} />

      {/* ponytail: <dialog> nativo. Trae foco atrapado, Escape y backdrop sin JS.
          m-auto porque el preflight de Tailwind pone margin:0 en todo y le come
          el margin:auto con el que el navegador centra un dialog modal. */}
      <dialog
        ref={dialogo}
        aria-labelledby={`vendida-${id}`}
        className="m-auto w-[min(400px,calc(100vw-2rem))] rounded-[14px] p-6 backdrop:bg-[rgba(20,23,26,0.45)]"
        style={{ background: "#FFFFFF", color: "#14171A" }}
      >
        <h2 id={`vendida-${id}`} className="text-[22px] leading-tight" style={{ fontWeight: 800 }}>
          ¡Felicitaciones por la venta!
        </h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470", lineHeight: 1.45 }}>
          Paletita es gratis y se banca solo. Si te sirvió para vender “{titulo}”, podés
          colaborar con lo que quieras. Es opcional.
        </p>

        <form action={donar} className="mt-4">
          <input type="hidden" name="id" value={id} />
          {/* El monto que viaja es este: los radios son solo la eleccion visual. */}
          <input type="hidden" name="monto" value={monto ?? ""} />

          <fieldset>
            <legend className="text-[13px]" style={{ fontWeight: 600 }}>
              Elegí un monto
            </legend>

            <div className="mt-2 grid grid-cols-2 gap-2">
              {MONTOS_DONACION.map((m) => (
                <label key={m} className={opcionClass} style={{ outlineColor: VERDE }}>
                  <input
                    type="radio"
                    name={`donacion-${id}`}
                    className="sr-only"
                    checked={elegido === m}
                    onChange={() => setElegido(m)}
                  />
                  <span style={{ fontWeight: 700 }}>{formatPrecio(m)}</span>
                </label>
              ))}
              <label className={opcionClass} style={{ outlineColor: VERDE }}>
                <input
                  type="radio"
                  name={`donacion-${id}`}
                  className="sr-only"
                  checked={elegido === "otro"}
                  onChange={() => setElegido("otro")}
                />
                <span style={{ fontWeight: 700 }}>Otro monto</span>
              </label>
            </div>
          </fieldset>

          {elegido === "otro" && (
            <div className="mt-3">
              <label htmlFor={`monto-${id}`} className="block text-[13px]" style={{ fontWeight: 600 }}>
                Monto en pesos
              </label>
              <input
                ref={campo}
                id={`monto-${id}`}
                type="number"
                inputMode="numeric"
                min={MONTO_DONACION_MIN}
                max={MONTO_DONACION_MAX}
                step={100}
                value={otro}
                onChange={(e) => setOtro(e.target.value)}
                aria-describedby={`ayuda-monto-${id}`}
                className="mt-1 min-h-[44px] w-full rounded-[12px] px-3 text-[16px] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ border: BORDE, background: "#FFFFFF", color: "#14171A", outlineColor: VERDE }}
              />
              <p id={`ayuda-monto-${id}`} className="mt-1 text-[12px]" style={{ color: "#5B6470" }}>
                Entre {formatPrecio(MONTO_DONACION_MIN)} y {formatPrecio(MONTO_DONACION_MAX)}.
              </p>
            </div>
          )}

          <p
            className="mt-3 flex items-center gap-1.5 rounded-[10px] px-3 py-2.5 text-[12px]"
            style={{ background: "#FAFAF8", color: "#5B6470" }}
          >
            <CreditCard size={13} aria-hidden /> Te llevamos a MercadoPago. Al volver marcamos
            la publicación como vendida.
          </p>

          <div className="mt-4">
            <BotonDonar monto={monto} />
          </div>
        </form>

        <form action={cambiarEstado} className="mt-2.5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="estado" value="vendida" />
          <BotonSinDonar />
        </form>

        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="mt-1 min-h-[44px] w-full rounded-[14px] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#5B6470", fontWeight: 600, outlineColor: VERDE }}
        >
          Cancelar
        </button>
      </dialog>
    </>
  );
}
