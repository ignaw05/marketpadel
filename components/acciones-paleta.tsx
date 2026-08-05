"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { MoreVertical, PauseCircle, PlayCircle, Trash2, CheckCircle2 } from "lucide-react";
import { cambiarEstado, eliminar } from "@/app/(main)/mis-publicaciones/actions";
import type { Paleta } from "@/lib/paletas";

const itemClass =
  "flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-[-2px] disabled:opacity-60";

function ItemSubmit({
  children,
  color = "#14171A",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={itemClass} style={{ color, outlineColor: "#0F5132" }}>
      {children}
    </button>
  );
}

function BotonEliminar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#D4183D", fontWeight: 600, outlineColor: "#D4183D" }}
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}

export function AccionesPaleta({ paleta }: { paleta: Paleta }) {
  const [menu, setMenu] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const activa = paleta.estado_publicacion === "activa";
  const vendida = paleta.estado_publicacion === "vendida";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenu((o) => !o)}
        aria-expanded={menu}
        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: "#5B6470", outlineColor: "#0F5132" }}
      >
        <MoreVertical size={18} aria-hidden />
        <span className="sr-only">Acciones de {paleta.marca} {paleta.modelo}</span>
      </button>

      {menu && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenu(false)}
          >
            <span className="sr-only">Cerrar el menú</span>
          </button>
          <div
            className="absolute right-0 top-full z-20 mt-1 w-52 rounded-[14px] p-1.5"
            style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 12px 28px rgba(0,0,0,0.10)" }}
          >
            {!vendida && (
              <form action={cambiarEstado} onSubmit={() => setMenu(false)}>
                <input type="hidden" name="id" value={paleta.id} />
                <input type="hidden" name="estado" value={activa ? "pausada" : "activa"} />
                <ItemSubmit>
                  {activa ? <PauseCircle size={15} aria-hidden /> : <PlayCircle size={15} aria-hidden />}
                  {activa ? "Pausar" : "Reactivar"}
                </ItemSubmit>
              </form>
            )}

            <form action={cambiarEstado} onSubmit={() => setMenu(false)}>
              <input type="hidden" name="id" value={paleta.id} />
              <input type="hidden" name="estado" value={vendida ? "activa" : "vendida"} />
              <ItemSubmit>
                <CheckCircle2 size={15} aria-hidden />
                {vendida ? "Volver a publicar" : "Marcar como vendida"}
              </ItemSubmit>
            </form>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                dialogo.current?.showModal();
              }}
              className={itemClass}
              style={{ color: "#D4183D", outlineColor: "#D4183D" }}
            >
              <Trash2 size={15} aria-hidden /> Eliminar
            </button>
          </div>
        </>
      )}

      {/* ponytail: <dialog> nativo. Trae foco atrapado, Escape y backdrop sin JS. */}
      <dialog
        ref={dialogo}
        className="w-[min(380px,calc(100vw-3rem))] rounded-[14px] p-6 backdrop:bg-[rgba(20,23,26,0.45)]"
        style={{ background: "#FFFFFF", color: "#14171A" }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>¿Eliminar publicación?</h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470" }}>
          Vas a eliminar “{paleta.marca} {paleta.modelo}”. Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="min-h-[44px] flex-1 rounded-[14px] py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600, outlineColor: "#0F5132" }}
          >
            Cancelar
          </button>
          <form action={eliminar} className="flex flex-1">
            <input type="hidden" name="id" value={paleta.id} />
            <BotonEliminar />
          </form>
        </div>
      </dialog>
    </div>
  );
}
