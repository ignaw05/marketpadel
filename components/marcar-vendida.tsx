"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { cambiarEstado } from "@/app/(main)/mis-publicaciones/actions";

function Boton({ titulo }: { titulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
    >
      <CheckCircle2 size={11} aria-hidden />
      {pending ? "Marcando…" : "La vendí"}
      <span className="sr-only"> — {titulo}</span>
    </button>
  );
}

export function MarcarVendida({ id, titulo }: { id: string; titulo: string }) {
  return (
    <form action={cambiarEstado}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value="vendida" />
      <Boton titulo={titulo} />
    </form>
  );
}
