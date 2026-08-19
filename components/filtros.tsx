"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Check, ChevronDown, X } from "lucide-react";
import {
  FORMAS,
  PROVINCIAS,
  ESTADOS,
  PRECIO_TOPE,
  PRECIO_PASO,
  ORDENES,
  formatPrecio,
  topePrecio,
  ordenActual,
} from "@/lib/paletas";

const CLAVES = ["marca", "forma", "precioMax", "provincia", "estado"];

/** Arma el href conservando el resto de los filtros y la busqueda. */
function useHref() {
  const params = useSearchParams();
  return (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    // Tocar un filtro vuelve a la primera pagina: el resultado es otro, y
    // quedarse en la 5 del anterior cae casi siempre en una pagina vacia.
    p.delete("pagina");
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
  const ordenadas = [...opciones].sort((a, b) => a.localeCompare(b, "es-AR"));

  return (
    <div className="relative md:w-full">
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-expanded={abierto}
        className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:w-full md:justify-between md:rounded-[12px]"
        style={{
          background: valor ? "#057305" : "#FFFFFF",
          color: valor ? "#FFFFFF" : "#14171A",
          border: `1px solid ${valor ? "#057305" : "#E6E4DF"}`,
          fontWeight: 600,
          outlineColor: "#057305",
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
            className="absolute left-0 top-full z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-[14px] p-1.5 md:w-full"
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
            {ordenadas.map((o) => (
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

/**
 * Barra verde con el orden puesto, aparte de los filtros: ordenar no es filtrar
 * y siempre hay uno activo, asi que el control muestra el valor en vez de una
 * etiqueta generica.
 */
function Orden() {
  const [abierto, setAbierto] = useState(false);
  const params = useSearchParams();
  const href = useHref();
  const actual = ordenActual(params.get("orden") ?? undefined);

  return (
    <div className="relative w-full" onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}>
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-expanded={abierto}
        className="flex min-h-[52px] w-full items-center gap-2.5 rounded-[12px] px-3.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "#057305", color: "#FFFFFF", outlineColor: "#057305" }}
      >
        <ArrowUpDown size={18} aria-hidden style={{ flexShrink: 0 }} />
        <span className="min-w-0 flex-1">
          <span
            className="block text-[10px] uppercase tracking-[0.08em]"
            style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}
          >
            Ordenado por
          </span>
          <span className="block truncate text-[15px]" style={{ fontWeight: 700 }}>
            {actual.label}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden style={{ flexShrink: 0 }} />
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
            className="absolute left-0 top-full z-20 mt-2 w-full rounded-[14px] p-1.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E4DF",
              boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
            }}
          >
            {ORDENES.map((o) => (
              <Link
                key={o.valor}
                // El default no ensucia la URL: se va del querystring.
                href={href("orden", o.valor === ORDENES[0].valor ? null : o.valor)}
                scroll={false}
                onClick={() => setAbierto(false)}
                aria-current={actual.valor === o.valor ? "true" : undefined}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-[13px] hover:bg-[#F2F1ED]"
                style={{
                  color: actual.valor === o.valor ? "#057305" : "#14171A",
                  fontWeight: actual.valor === o.valor ? 700 : 400,
                }}
              >
                {o.label}
                {actual.valor === o.valor && <Check size={16} aria-hidden />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ponytail: <input type="range"> nativo con accent-color, sin libreria de slider.
 * Un solo pulgar = precio maximo; el minimo es siempre 0. Si hace falta rango
 * min-max, ahi si entra un componente de dos pulgares.
 * Navega al soltar (pointerup/keyup), no en cada pixel: cada commit es una query.
 */
function PrecioSlider() {
  const params = useSearchParams();
  const router = useRouter();
  const href = useHref();
  const [valor, setValor] = useState(topePrecio(params.get("precioMax") ?? undefined) ?? PRECIO_TOPE);

  const aplicar = () =>
    router.replace(href("precioMax", valor >= PRECIO_TOPE ? null : String(valor)), {
      scroll: false,
    });

  return (
    <div className="w-full md:mt-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="precioMax" className="text-[13px]" style={{ color: "#14171A", fontWeight: 600 }}>
          Precio hasta
        </label>
        <output htmlFor="precioMax" className="text-[13px]" style={{ color: "#5B6470" }}>
          {valor >= PRECIO_TOPE ? "Sin tope" : formatPrecio(valor)}
        </output>
      </div>
      <input
        id="precioMax"
        name="precioMax"
        type="range"
        min={PRECIO_PASO}
        max={PRECIO_TOPE}
        step={PRECIO_PASO}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        onPointerUp={aplicar}
        onKeyUp={aplicar}
        className="h-11 w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ accentColor: "#057305", outlineColor: "#057305" }}
      />
    </div>
  );
}

export function Filtros({ marcas }: { marcas: string[] }) {
  const params = useSearchParams();
  const activos = CLAVES.filter((k) => params.get(k)).length;

  // Limpiar filtros no toca la busqueda ni el orden: no son filtros.
  const limpio = new URLSearchParams();
  for (const k of ["q", "orden"]) {
    const v = params.get(k);
    if (v) limpio.set(k, v);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 pb-1 md:mb-0 md:flex-col md:items-stretch md:gap-3">
      <Orden />
      <Dropdown etiqueta="Marca" clave="marca" opciones={marcas} />
      <Dropdown etiqueta="Forma" clave="forma" opciones={[...FORMAS]} />
      <Dropdown etiqueta="Provincia" clave="provincia" opciones={[...PROVINCIAS]} />
      <Dropdown etiqueta="Estado" clave="estado" opciones={ESTADOS.map((e) => e.label)} />
      {/* key: al limpiar filtros o volver atras, el pulgar se reposiciona solo */}
      <PrecioSlider key={params.get("precioMax") ?? ""} />

      {activos > 0 && (
        <Link
          href={limpio.toString() ? `/?${limpio}` : "/"}
          className="flex min-h-[44px] items-center gap-1 rounded-full px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 md:justify-center"
          style={{ color: "#5B6470", fontWeight: 600, outlineColor: "#057305" }}
        >
          <X size={14} aria-hidden /> Limpiar filtros
        </Link>
      )}
    </div>
  );
}
