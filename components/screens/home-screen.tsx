import { Suspense } from "react";
import Link from "next/link";
import { SearchX, PackageOpen, Plus } from "lucide-react";
import { PaletaCard } from "../paleta-card";
import { Filtros } from "../filtros";
import { Paginacion } from "../paginacion";
import { Actividad } from "../actividad";
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

/**
 * Lo unico que Google tiene para entender de que se trata el sitio: la grilla
 * es puro alt de fotos. Solo va en la portada limpia; repetida en cada faceta
 * serian las mismas 300 palabras en /?marca=Nox y en /?ciudad=Rosario, y eso
 * se lee como contenido duplicado.
 */
function QueEsPaletita() {
  const h2 = { color: "#14171A", fontWeight: 700 } as const;

  return (
    <section
      className="mt-12 max-w-[70ch] pt-8"
      style={{ borderTop: "1px solid #E6E4DF" }}
    >
      <h2 className="text-[18px]" style={h2}>
        Qué es Paletita
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        Paletita es el marketplace dedicado exclusivamente a la compraventa de
        paletas de pádel usadas en Argentina. Si jugás varias veces por semana y
        querés renovar tu equipo sin pagar precio de paleta nueva, o si tenés una
        paleta guardada que ya no usás, Paletita te conecta directo con otros
        jugadores de tu zona.
      </p>

      <h2 className="mt-6 text-[18px]" style={h2}>
        Cómo funciona
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        Creá tu cuenta gratis, publicá tu paleta con fotos y precio, y esperá el
        contacto de los compradores interesados por WhatsApp. Sin intermediarios,
        sin comisiones por venta, sin vueltas.
      </p>

      <h2 className="mt-6 text-[18px]" style={h2}>
        Por qué Paletita y no MercadoLibre o un grupo de Facebook
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        MercadoLibre cobra comisión por venta y no está pensado para
        equipamiento de pádel. Los grupos de Facebook funcionan, pero son
        desordenados: no hay perfiles, no hay estructura de publicación, y las
        paletas se pierden entre cientos de posteos. Paletita es 100% pádel,
        publicar es gratis, y tu paleta queda en un listado prolijo que no se
        pierde en el scroll.
      </p>

      <h2 className="mt-6 text-[18px]" style={h2}>
        Para compradores
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        Explorá paletas usadas de distintas marcas y niveles, filtrá por lo que
        buscás, y escribile directo al vendedor por WhatsApp para coordinar la
        compra, a tu ritmo y sin presión de plataforma.
      </p>

      <h2 className="mt-6 text-[18px]" style={h2}>
        Para vendedores
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        Publicar tu paleta te toma minutos. Subís fotos, contás el estado y el
        precio, y los compradores interesados te escriben directo. Vos manejás la
        conversación y coordinás la entrega como prefieras.
      </p>

      <h2 className="mt-6 text-[18px]" style={h2}>
        ¿Es seguro?
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#5B6470" }}>
        Toda la comunicación es directa por WhatsApp, con el perfil del otro
        jugador a la vista, igual que ya hacés en los grupos de compraventa. La
        diferencia es que en Paletita tu publicación no se pierde ni queda
        enterrada.
      </p>

      {/* A /publicar y no a /auth: sin sesion el proxy lo manda al login con el
          next puesto, y con sesion cae donde queria ir. Un solo link sirve para
          los dos casos. */}
      <Link
        href="/publicar"
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
      >
        <Plus size={16} aria-hidden /> Publicar una paleta
      </Link>
    </section>
  );
}

export function HomeScreen({
  paletas,
  marcas,
  ciudades,
  filtros,
  pagina,
  hayMas,
}: {
  paletas: Paleta[];
  marcas: string[];
  ciudades: string[];
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
      {/* Unico h1 de la home. Sin esto la portada no tiene una sola linea de
          texto propio: es una grilla de fotos y nada mas. */}
      <header className="mb-4">
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
          className="mt-1 max-w-[70ch] text-[14px] leading-relaxed"
          style={{ color: "#5B6470" }}
        >
          Comprá y vendé paletas de pádel usadas entre jugadores. Publicar es
          gratis, ves el estado real de cada paleta y hablás directo con el
          vendedor por WhatsApp.
        </p>
      </header>

      <div className="flex flex-col md:flex-row md:gap-8">
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

      {!buscando && <QueEsPaletita />}
    </div>
  );
}
