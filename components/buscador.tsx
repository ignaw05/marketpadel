"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CLAVES_FILTRO } from "@/lib/paletas";

/**
 * Lo que hay que arrastrar al buscar para no perderlo. Sale de CLAVES_FILTRO en
 * vez de una lista propia: cuando entra un filtro nuevo (permuta fue el ultimo),
 * el buscador lo conserva solo. `orden` no es filtro pero tambien se mantiene.
 */
const CONSERVAR = [...CLAVES_FILTRO.filter((k) => k !== "q"), "orden"];

/**
 * ponytail: form GET nativo, busca al hacer Enter. Sin router.replace por tecla,
 * que ahora seria una query a la base por letra. Si se quiere busqueda en vivo,
 * el upgrade es un debounce de ~300ms sobre onChange.
 *
 * Ya no vive en el header: desde que el header dejo de llevarlo, el buscador
 * scrollea con el feed. Lo unico fijo es la barra verde y la tira de sponsors.
 */
export function Buscador({ className }: { className?: string }) {
  const params = useSearchParams();

  return (
    <form action="/" className={className}>
      {CONSERVAR.map((k) => {
        const v = params.get(k);
        return v ? <input key={k} type="hidden" name={k} value={v} /> : null;
      })}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 md:left-4"
          style={{ color: "#5B6470" }}
          aria-hidden
        />
        <label className="sr-only" htmlFor="buscar">
          Buscar por marca o modelo
        </label>
        <input
          id="buscar"
          name="q"
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Buscar por marca o modelo…"
          className="min-h-[48px] w-full rounded-[14px] py-2.5 pl-11 pr-3 text-[15px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-[63px] md:rounded-[16px] md:pl-12"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6E4DF",
            color: "#14171A",
            outlineColor: "#057305",
          }}
        />
      </div>
    </form>
  );
}
