import { Suspense } from "react";
import Link from "next/link";
import { SearchX, PackageOpen, Plus } from "lucide-react";
import { PaletaCard } from "../paleta-card";
import { Filtros } from "../filtros";
import type { Paleta, FiltrosFeed } from "@/lib/paletas";

function SinResultados() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "#F2F1ED" }}
      >
        <SearchX size={28} style={{ color: "#5B6470" }} aria-hidden />
      </div>
      <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
        No encontramos paletas
      </p>
      <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
        Probá ajustando los filtros o la búsqueda.
      </p>
      <Link
        href="/"
        className="mt-5 flex min-h-[44px] items-center rounded-[14px] px-4 py-2.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E4DF",
          color: "#14171A",
          fontWeight: 600,
          outlineColor: "#0F5132",
        }}
      >
        Ver todas las paletas
      </Link>
    </div>
  );
}

function TodavíaNoHayNada() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[14px] py-24 text-center"
      style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "#F2F1ED" }}
      >
        <PackageOpen size={28} style={{ color: "#0F5132" }} aria-hidden />
      </div>
      <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
        Todavía no hay paletas publicadas
      </p>
      <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
        Sé el primero: publicá la tuya y arrancá el mercado.
      </p>
      <Link
        href="/publicar"
        className="mt-5 flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
      >
        <Plus size={16} aria-hidden /> Publicar una paleta
      </Link>
    </div>
  );
}

export function HomeScreen({
  paletas,
  marcas,
  ciudades,
  filtros,
}: {
  paletas: Paleta[];
  marcas: string[];
  ciudades: string[];
  filtros: FiltrosFeed;
}) {
  // Solo las claves que la query mira. Con Object.values(), cualquier param de
  // paso (?error=..., ?utm_source=...) haria creer que hay filtros puestos y
  // mostraria "no encontramos" en vez del vacio real.
  const buscando = (["q", "marca", "forma", "ciudad", "precioMax", "estado"] as const).some(
    (k) => filtros[k],
  );

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col px-4 py-5 md:flex-row md:gap-8 md:px-6">
      <aside className="md:w-[220px] md:shrink-0">
        <Suspense fallback={<div className="mb-5 h-[44px] md:h-[320px]" />}>
          <Filtros marcas={marcas} ciudades={ciudades} />
        </Suspense>
      </aside>

      <div className="min-w-0 flex-1">
        {paletas.length === 0 ? (
          buscando ? (
            <SinResultados />
          ) : (
            <TodavíaNoHayNada />
          )
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {paletas.map((p, i) => (
              <PaletaCard key={p.id} paleta={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
