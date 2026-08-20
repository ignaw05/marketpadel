"use client";

import { useFormStatus } from "react-dom";
import { BadgeCheck } from "lucide-react";
import { usarCredito } from "@/app/(main)/pro/actions";
import { PLAN_PRO } from "@/lib/pro";

function Boton({ titulo }: { titulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-2.5 text-[12px] transition-colors hover:bg-[rgba(5,115,5,0.06)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: "1px solid #057305",
        color: "#057305",
        fontWeight: 600,
        outlineColor: "#057305",
      }}
    >
      <BadgeCheck size={13} aria-hidden />
      {pending ? "Usando…" : `Usar promoción Pro (${PLAN_PRO.diasPromo} días)`}
      <span className="sr-only"> — {titulo}</span>
    </button>
  );
}

/**
 * Canjea uno de los créditos del plan. Aparece al lado de "Promocionar", no en
 * lugar suyo: quedarse sin créditos no tiene que dejar al vendedor sin la opción
 * de pagar una promoción suelta.
 */
export function UsarCredito({ id, titulo }: { id: string; titulo: string }) {
  return (
    <form action={usarCredito}>
      <input type="hidden" name="id" value={id} />
      <Boton titulo={titulo} />
    </form>
  );
}
