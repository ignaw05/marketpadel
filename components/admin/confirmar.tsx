"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

function BotonConfirmar({
  texto,
  cargando,
  peligro,
}: {
  texto: string;
  cargando: string;
  peligro: boolean;
}) {
  const { pending } = useFormStatus();
  const color = peligro ? "#D4183D" : "#057305";
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: color, fontWeight: 600, outlineColor: color }}
    >
      {pending ? cargando : texto}
    </button>
  );
}

/**
 * Boton que pide confirmacion antes de disparar una server action. Todas las
 * acciones del panel bajan contenido o cortan el acceso de alguien: ninguna
 * tendria que salir de un click al pasar.
 *
 * ponytail: <dialog> nativo, sin libreria. Trae foco atrapado, Escape y
 * backdrop gratis. m-auto porque el preflight de Tailwind pone margin:0 en todo
 * y le come el margin:auto con el que el navegador centra un dialog modal.
 */
export function Confirmar({
  accion,
  id,
  etiqueta,
  titulo,
  detalle,
  confirmar,
  cargando,
  peligro = false,
  className,
}: {
  accion: (fd: FormData) => Promise<void>;
  id: string;
  /** Texto del boton que abre el dialogo. */
  etiqueta: string;
  titulo: string;
  detalle: string;
  /** Texto del boton que ejecuta. */
  confirmar: string;
  cargando: string;
  peligro?: boolean;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className={
          className ??
          "min-h-[44px] rounded-[14px] px-3 py-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
        }
        style={{
          border: `1px solid ${peligro ? "#D4183D" : "#E6E4DF"}`,
          color: peligro ? "#D4183D" : "#14171A",
          fontWeight: 600,
          outlineColor: peligro ? "#D4183D" : "#057305",
        }}
      >
        {etiqueta}
      </button>

      <dialog
        ref={dialogo}
        className="m-auto w-[min(380px,calc(100vw-3rem))] rounded-[14px] p-6 backdrop:bg-[rgba(20,23,26,0.45)]"
        style={{ background: "#FFFFFF", color: "#14171A" }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>{titulo}</h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
          {detalle}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
          >
            Cancelar
          </button>
          <form action={accion} className="flex flex-1">
            <input type="hidden" name="id" value={id} />
            <BotonConfirmar texto={confirmar} cargando={cargando} peligro={peligro} />
          </form>
        </div>
      </dialog>
    </>
  );
}
