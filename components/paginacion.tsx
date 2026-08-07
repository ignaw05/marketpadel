import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FiltrosFeed } from "@/lib/paletas";

/**
 * Server Component: la pagina vive en la URL, asi que no hace falta estado ni
 * javascript. Los links funcionan con el back del navegador y se pueden
 * compartir con los filtros puestos.
 */

/** Conserva los filtros y cambia solo la pagina. La 1 no lleva parametro. */
function href(filtros: FiltrosFeed, pagina: number): string {
  const p = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (clave !== "pagina" && valor) p.set(clave, valor);
  }
  if (pagina > 1) p.set("pagina", String(pagina));
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

const ESTILO = {
  background: "#FFFFFF",
  border: "1px solid #E6E4DF",
  color: "#14171A",
  fontWeight: 600,
  outlineColor: "#0F5132",
} as const;

export function Paginacion({
  filtros,
  pagina,
  hayMas,
}: {
  filtros: FiltrosFeed;
  pagina: number;
  hayMas: boolean;
}) {
  // Una sola pagina: no hay nada que navegar.
  if (pagina === 1 && !hayMas) return null;

  return (
    <nav
      aria-label="Paginación"
      className="mt-6 flex items-center justify-between gap-3"
    >
      {pagina > 1 ? (
        <Link
          href={href(filtros, pagina - 1)}
          rel="prev"
          className="flex min-h-[44px] items-center gap-1 rounded-[14px] px-4 py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={ESTILO}
        >
          <ChevronLeft size={16} aria-hidden />
          Anterior
        </Link>
      ) : (
        // Placeholder para que "Siguiente" no salte de lugar en la pagina 1.
        <span />
      )}

      <p className="text-[14px]" style={{ color: "#5B6470" }}>
        Página {pagina}
      </p>

      {hayMas ? (
        <Link
          href={href(filtros, pagina + 1)}
          rel="next"
          className="flex min-h-[44px] items-center gap-1 rounded-[14px] px-4 py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={ESTILO}
        >
          Siguiente
          <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
