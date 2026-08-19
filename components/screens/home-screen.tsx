import { Suspense } from "react";
import Link from "next/link";
import { SearchX, PackageOpen, Plus, Receipt } from "lucide-react";
import { PaletaCard } from "../paleta-card";
import { Filtros } from "../filtros";
import { Paginacion } from "../paginacion";
import { Actividad } from "../actividad";
import { SobrePaletita } from "../sobre-paletita";
import {
  CLAVES_FILTRO,
  tituloFeed,
  type Paleta,
  type FiltrosFeed,
} from "@/lib/paletas";

function SinResultados() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "#F2F1ED" }}
      >
        <SearchX size={28} style={{ color: "#5B6470" }} aria-hidden />
      </div>
      <p
        className="mt-4 text-[16px]"
        style={{ color: "#14171A", fontWeight: 600 }}
      >
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
          outlineColor: "#057305",
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
        <PackageOpen size={28} style={{ color: "#057305" }} aria-hidden />
      </div>
      <p
        className="mt-4 text-[16px]"
        style={{ color: "#14171A", fontWeight: 600 }}
      >
        Todavía no hay paletas publicadas
      </p>
      <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
        Sé el primero: publicá la tuya y arrancá el mercado.
      </p>
      <Link
        href="/publicar"
        className="mt-5 flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: "#057305",
          fontWeight: 600,
          outlineColor: "#057305",
        }}
      >
        <Plus size={16} aria-hidden /> Publicar una paleta
      </Link>
    </div>
  );
}

export function HomeScreen({
  paletas,
  marcas,
  filtros,
  pagina,
  hayMas,
}: {
  paletas: Paleta[];
  marcas: string[];
  filtros: FiltrosFeed;
  pagina: number;
  hayMas: boolean;
}) {
  // Solo las claves que la query mira. Con Object.values(), cualquier param de
  // paso (?error=..., ?utm_source=...) haria creer que hay filtros puestos y
  // mostraria "no encontramos" en vez del vacio real.
  //
  // `pagina > 1` cuenta como buscar: un ?pagina=999 a mano cae en una pagina
  // vacia, y ahi corresponde "no encontramos" con la salida a /, no el
  // "todavia no hay nada publicado", que seria mentira.
  const buscando = CLAVES_FILTRO.some((k) => filtros[k]) || pagina > 1;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
      <div className="mb-4 flex justify-end">
        <Link
          href="/ventas"
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
        >
          <Receipt size={14} aria-hidden /> Historial de ventas
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8">
        <aside className="md:w-[220px] md:shrink-0">
          <Suspense fallback={<div className="mb-5 h-[44px] md:h-[320px]" />}>
            <Filtros marcas={marcas} />
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
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {paletas.map((p, i) => (
                  <PaletaCard key={p.id} paleta={p} priority={i < 4} />
                ))}
              </div>
              <Paginacion filtros={filtros} pagina={pagina} hayMas={hayMas} />
            </>
          )}
        </div>

        <Actividad />
      </div>

      {/* Unico h1 de la home, abajo del listado a proposito: la grilla de
          paletas es lo primero que se ve, el texto viene despues. */}
      <header className="mt-10 max-w-[70ch]">
        <h1
          className="text-[20px] md:text-[26px]"
          style={{
            color: "#14171A",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {tituloFeed(filtros)}
        </h1>
        <p
          className="mt-1 text-[14px] leading-relaxed"
          style={{ color: "#5B6470" }}
        >
          Comprá y vendé paletas de pádel usadas entre jugadores. Publicar es
          gratis, ves el estado real de cada paleta y hablás directo con el
          vendedor por WhatsApp.
        </p>
      </header>

      {!buscando && <SobrePaletita />}
    </div>
  );
}
