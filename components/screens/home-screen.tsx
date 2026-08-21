import { Suspense } from "react";
import Link from "next/link";
import { SearchX, PackageOpen, Plus, Receipt, BadgeCheck, ChevronRight } from "lucide-react";
import { PaletaCard } from "../paleta-card";
import { Buscador } from "../buscador";
import { Filtros, Orden } from "../filtros";
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

const accesoBase =
  "items-center justify-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";

/** El acceso a /vendedores: el mismo boton que el historial, en el lima de Pro. */
const proStyle = {
  background: "#C7F751",
  color: "#14171A",
  fontWeight: 700,
  letterSpacing: "-0.015em",
  outlineColor: "#057305",
} as const;

const historialStyle = {
  background: "#FFFFFF",
  border: "1px solid #E6E4DF",
  color: "#14171A",
  fontWeight: 600,
  outlineColor: "#057305",
} as const;

export function HomeScreen({
  paletas,
  marcas,
  filtros,
  pagina,
  hayMas,
  carteleras,
}: {
  paletas: Paleta[];
  marcas: string[];
  filtros: FiltrosFeed;
  pagina: number;
  hayMas: boolean;
  /** Adelanto de /vendedores. Llega ya renderizado: esta pantalla no toca la base. */
  carteleras?: React.ReactNode;
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
    <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-6">
      {/* El buscador vive acá desde que salio del header: scrollea con el feed.
          En desktop comparte fila con los dos accesos, que miden lo mismo y
          arrancan donde termina el buscador: nada queda colgado en una fila
          propia. En mobile los dos bajan, cada uno a lo suyo. Suspense porque
          lee la query. */}
      <div className="mb-3 flex gap-4 md:mb-5">
        <Suspense fallback={<div className="h-[48px] min-w-0 flex-1 md:h-[63px]" />}>
          <Buscador className="min-w-0 flex-1" />
        </Suspense>
        <Link
          href="/vendedores"
          className={`${accesoBase} hidden md:flex md:w-[240px] md:shrink-0 md:min-h-[63px] md:rounded-[16px] md:text-[16px]`}
          style={proStyle}
        >
          <BadgeCheck size={20} strokeWidth={2.25} aria-hidden /> Vendedores Pro
        </Link>
        <Link
          href="/ventas"
          className={`${accesoBase} hidden md:flex md:w-[320px] md:shrink-0 md:min-h-[63px] md:rounded-[16px] md:text-[16px]`}
          style={historialStyle}
        >
          <Receipt size={20} aria-hidden /> Historial de ventas
        </Link>
      </div>

      {/* La misma puerta, en celular. Ahi no entra al lado del buscador, asi
          que baja a lo ancho y aprovecha el lugar para decir que hay del otro
          lado. En desktop no se dibuja: vive en la fila de arriba. */}
      <Link
        href="/vendedores"
        className="mb-3 flex min-h-[56px] items-center gap-3 rounded-[14px] px-3.5 py-2.5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
        style={proStyle}
      >
        <BadgeCheck size={20} strokeWidth={2.25} className="shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px]">Vendedores Pro</span>
          <span
            className="mt-0.5 block text-[12px]"
            style={{ color: "#3B4550", fontWeight: 400, letterSpacing: "normal", lineHeight: 1.35 }}
          >
            Los vendedores oficiales, todos en el mismo lugar.
          </span>
        </span>
        <ChevronRight size={18} strokeWidth={2.25} className="shrink-0" aria-hidden />
      </Link>

{/* Mobile: ordenar y el historial comparten fila, mismo alto.

          flex-wrap con min-w y no grid-cols-2: los dos controles necesitan
          ~172px para que su texto entre en una linea. Con grid a dos columnas
          fijas, abajo de 388px de viewport la columna queda en 165px y
          "Historial de ventas" se parte en dos renglones, que ademas descuadra
          el alto de la fila. Asi se acomodan solos: entran juntos donde hay
          lugar (393px, el ancho del mockup) y se apilan a lo ancho donde no. */}
      <div className="mb-3 flex flex-wrap gap-3 md:hidden">
        <Suspense fallback={<div className="h-[52px] min-w-[172px] flex-1" />}>
          <Orden className="min-w-[172px] flex-1" />
        </Suspense>
        <Link
          href="/ventas"
          className={`${accesoBase} flex min-w-[172px] flex-1 min-h-[52px] rounded-[12px] px-2.5 text-[14px] md:hidden`}
          style={historialStyle}
        >
          <Receipt size={16} aria-hidden /> Historial de ventas
        </Link>
      </div>


      <div className="flex flex-col md:flex-row md:gap-8">
        <aside className="md:w-[252px] md:shrink-0">
          <Suspense fallback={<div className="mb-5 h-[44px] md:h-[320px]" />}>
            <Filtros marcas={marcas} />
          </Suspense>
        </aside>

        <div className="min-w-0 flex-1">
          {!buscando && carteleras}
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
