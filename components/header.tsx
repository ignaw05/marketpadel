"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LayoutGrid, LogIn, UserRound, Menu, ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { Sponsors } from "./sponsors";
import type { Sponsor } from "@/lib/sponsors-db";

const VERDE = "#057305";

/**
 * Los tres controles de la derecha comparten caja optica y area tactil: 20px de
 * glifo dentro de 44px de target. Medido sobre el mockup, donde los tres ocupan
 * el mismo cuadrado y estan alineados al mismo centro.
 *
 * El unico apartamiento del mockup es la separacion: ahi los centros estan a
 * 26px y un target de 44px no entra sin pisarse con el de al lado. Las cajas van
 * pegadas (gap 0), que deja los centros a 44px.
 */
const GLIFO = 20;

const accionHeader =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white";

/** ponytail: SVG inline. lucide-react v1 sacó los iconos de marca, no hay `Instagram`. */
function IconoInstagram() {
  return (
    <svg
      width={GLIFO}
      height={GLIFO}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      // 1.75 y no 2: en el mockup el trazo de Instagram es mas fino que las
      // barras de la hamburguesa, y a 20px la diferencia se ve.
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/** Ocupa el lugar del buscador fuera del feed: ahi buscar paletas no hace nada. */
function VolverAlMercado() {
  return (
    <div
      className="px-4 py-1.5 md:px-6"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E6E4DF" }}
    >
      <div className="mx-auto max-w-[1280px]">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-2 text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#14171A", fontWeight: 600, outlineColor: VERDE }}
        >
          <ArrowLeft size={18} aria-hidden /> Volver al mercado
        </Link>
      </div>
    </div>
  );
}

const itemMenu =
  "flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * ponytail: <details> nativo, sin JS ni click-afuera. Se cierra al navegar o al
 * volver a tocar el boton. Si molesta quedar abierto, el upgrade es un onBlur
 * en el contenedor.
 */
function MenuPrincipal({
  usuario,
  enMisPaletas,
}: {
  usuario: { nombre: string; apellido: string } | null;
  enMisPaletas: boolean;
}) {
  return (
    <details className="relative">
      <summary
        aria-label="Menú"
        className={`${accionHeader} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <Menu size={GLIFO} strokeWidth={3} aria-hidden />
      </summary>

      <div
        className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-[14px] p-1.5 shadow-lg"
        style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
      >
        {usuario ? (
          <>
            <Link
              href="/mis-publicaciones"
              aria-current={enMisPaletas ? "page" : undefined}
              className={itemMenu}
              style={{
                color: enMisPaletas ? VERDE : "#14171A",
                background: enMisPaletas ? "#EAF4EA" : undefined,
                fontWeight: 600,
                outlineColor: VERDE,
              }}
            >
              <LayoutGrid size={16} aria-hidden /> Mis paletas
            </Link>
            {/* Sin iniciales ni avatar: el item dice que es. Cerrar sesión vive
                adentro de /cuenta, no acá. */}
            <Link
              href="/cuenta"
              className={itemMenu}
              style={{ color: "#14171A", fontWeight: 600, outlineColor: VERDE }}
            >
              <UserRound size={16} aria-hidden /> Mi perfil
            </Link>
          </>
        ) : (
          <Link
            href="/auth"
            className={itemMenu}
            style={{ color: "#14171A", fontWeight: 600, outlineColor: VERDE }}
          >
            <LogIn size={16} aria-hidden /> Ingresar
          </Link>
        )}
      </div>
    </details>
  );
}

/**
 * Lo unico que queda fijo al scrollear: la barra verde y, abajo, la tira de
 * sponsors. El buscador salio de acá y vive en el feed (components/screens/
 * home-screen), asi que se va con el scroll como el resto del contenido.
 */
export function Header({
  usuario,
  sponsors,
}: {
  usuario: { nombre: string; apellido: string } | null;
  sponsors: Sponsor[];
}) {
  const pathname = usePathname();
  const enMisPaletas = pathname === "/mis-publicaciones";
  const enFeed = pathname === "/";

  return (
    <header className="sticky top-0 z-30">
      <div style={{ background: VERDE }}>
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-2.5 md:px-6">
          {/* py-2.5 sobre un target de 44px da los 64px de alto del mockup. */}
          <Link
            href="/"
            className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Logo />
          </Link>

          <div className="ml-auto flex shrink-0 items-center">
            <a
              href="https://instagram.com/paletita.ar"
              target="_blank"
              rel="noopener noreferrer"
              className={accionHeader}
            >
              <IconoInstagram />
              <span className="sr-only">
                @paletita.ar en Instagram (abre en una pestaña nueva)
              </span>
            </a>

            <Link href="/publicar" className={accionHeader}>
              {/* El circulo blanco mide lo mismo que los otros dos glifos; el
                  target de 44px lo rodea sin dibujarse. */}
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: GLIFO, height: GLIFO, background: "#FFFFFF", color: VERDE }}
              >
                <Plus size={13} strokeWidth={3} aria-hidden />
              </span>
              <span className="sr-only">Publicar paleta</span>
            </Link>

            <MenuPrincipal usuario={usuario} enMisPaletas={enMisPaletas} />
          </div>
        </div>
      </div>

      {!enFeed && <VolverAlMercado />}

      <Sponsors sponsors={sponsors} />
    </header>
  );
}
