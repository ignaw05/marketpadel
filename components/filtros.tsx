"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { FORMAS, PRECIOS, ESTADOS } from "@/lib/paletas";

/** Arma el href conservando el resto de los filtros y la busqueda. */
function useHref() {
  const params = useSearchParams();
  return (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };
}

function Dropdown({
  etiqueta,
  clave,
  opciones,
}: {
  etiqueta: string;
  clave: string;
  opciones: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const params = useSearchParams();
  const href = useHref();
  const valor = params.get(clave);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-expanded={abierto}
        className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: valor ? "#0F5132" : "#FFFFFF",
          color: valor ? "#FFFFFF" : "#14171A",
          border: `1px solid ${valor ? "#0F5132" : "#E6E4DF"}`,
          fontWeight: 600,
          outlineColor: "#0F5132",
        }}
      >
        {valor ?? etiqueta}
        <ChevronDown size={14} style={{ opacity: 0.7 }} aria-hidden />
      </button>

      {abierto && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setAbierto(false)}
          >
            <span className="sr-only">Cerrar el menú</span>
          </button>
          <div
            className="absolute left-0 top-full z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-[14px] p-1.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E4DF",
              boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
            }}
            onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
          >
            <Link
              href={href(clave, null)}
              onClick={() => setAbierto(false)}
              className="block rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-[#F2F1ED]"
              style={{ color: "#5B6470" }}
            >
              Todas
            </Link>
            {opciones.map((o) => (
              <Link
                key={o}
                href={href(clave, o)}
                onClick={() => setAbierto(false)}
                aria-current={valor === o ? "true" : undefined}
                className="block rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-[#F2F1ED]"
                style={{
                  color: "#14171A",
                  background: valor === o ? "#F2F1ED" : "transparent",
                  fontWeight: valor === o ? 600 : 400,
                }}
              >
                {o}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Filtros({ marcas, ciudades }: { marcas: string[]; ciudades: string[] }) {
  const params = useSearchParams();
  const activos = ["marca", "forma", "precio", "ciudad", "estado"].filter((k) =>
    params.get(k),
  ).length;
  const q = params.get("q");

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 pb-1">
      <Dropdown etiqueta="Marca" clave="marca" opciones={marcas} />
      <Dropdown etiqueta="Forma" clave="forma" opciones={[...FORMAS]} />
      <Dropdown etiqueta="Precio" clave="precio" opciones={PRECIOS.map((p) => p.label)} />
      <Dropdown etiqueta="Ubicación" clave="ciudad" opciones={ciudades} />
      <Dropdown etiqueta="Estado" clave="estado" opciones={ESTADOS.map((e) => e.label)} />

      {activos > 0 && (
        <Link
          href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
          className="flex min-h-[44px] items-center gap-1 rounded-full px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#5B6470", fontWeight: 600, outlineColor: "#0F5132" }}
        >
          <X size={14} aria-hidden /> Limpiar filtros
        </Link>
      )}
    </div>
  );
}
