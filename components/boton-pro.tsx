"use client";

import { useFormStatus } from "react-dom";
import { suscribirPro } from "@/app/(main)/pro/actions";
import { PLAN_PRO } from "@/lib/pro";
import { formatPrecio } from "@/lib/paletas";

function Boton({ texto, variante }: { texto: string; variante: "lima" | "verde" }) {
  const { pending } = useFormStatus();
  const lima = variante === "lima";

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[16px] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: lima ? "#C7F751" : "#057305",
        color: lima ? "#14171A" : "#FFFFFF",
        fontWeight: 700,
        letterSpacing: "-0.015em",
        // Sobre el bloque verde el foco verde no se ve: ahí el anillo va claro.
        outlineColor: lima ? "#FFFFFF" : "#057305",
      }}
    >
      {pending ? "Te llevamos a MercadoPago…" : texto}
    </button>
  );
}

export function BotonPro({
  texto = "Activar Vendedor Pro",
  variante = "verde",
}: {
  texto?: string;
  variante?: "lima" | "verde";
}) {
  return (
    <form action={suscribirPro}>
      <Boton texto={texto} variante={variante} />
    </form>
  );
}

/** El mismo botón, con el precio adentro. Se usa para renovar. */
export function BotonRenovarPro() {
  return <BotonPro texto={`Renovar por ${formatPrecio(PLAN_PRO.precio)}`} />;
}
