"use client";

import { useFormStatus } from "react-dom";
import { RotateCw } from "lucide-react";
import { renovar } from "@/app/(main)/mis-publicaciones/actions";
import { DURACION_DIAS } from "@/lib/paletas";

function Boton({ titulo }: { titulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 text-[13px] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: "#FFFFFF",
        border: "1px solid #0F5132",
        color: "#0F5132",
        fontWeight: 600,
        outlineColor: "#0F5132",
      }}
    >
      <RotateCw size={14} aria-hidden />
      {pending ? "Renovando…" : `Renovar ${DURACION_DIAS} días`}
      <span className="sr-only"> — {titulo}</span>
    </button>
  );
}

export function Renovar({ id, titulo }: { id: string; titulo: string }) {
  return (
    <form action={renovar}>
      <input type="hidden" name="id" value={id} />
      <Boton titulo={titulo} />
    </form>
  );
}
