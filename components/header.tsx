"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, LayoutGrid, LogOut, LogIn, UserRound, ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { cerrarSesion } from "@/app/auth/actions";

const OTROS_FILTROS = ["marca", "forma", "precioMax", "estado"];

/** ponytail: SVG inline. lucide-react v1 sacó los iconos de marca, no hay `Instagram`. */
function IconoInstagram() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

/**
 * ponytail: form GET nativo, busca al hacer Enter. Sin router.replace por tecla,
 * que ahora seria una query a la base por letra. Si se quiere busqueda en vivo,
 * el upgrade es un debounce de ~300ms sobre onChange.
 */
function Buscador({ id, className }: { id: string; className?: string }) {
  const params = useSearchParams();

  return (
    <form action="/" className={className}>
      {OTROS_FILTROS.map((k) => {
        const v = params.get(k);
        return v ? <input key={k} type="hidden" name={k} value={v} /> : null;
      })}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "#5B6470" }}
          aria-hidden
        />
        <label className="sr-only" htmlFor={id}>
          Buscar por marca o modelo
        </label>
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Buscar por marca o modelo…"
          className="min-h-[44px] w-full rounded-[14px] py-2.5 pl-10 pr-3 text-[14px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: "#FAFAF8",
            border: "1px solid #E6E4DF",
            color: "#14171A",
            outlineColor: "#057305",
          }}
        />
      </div>
    </form>
  );
}

/** Ocupa el lugar del buscador fuera del feed: ahi buscar paletas no hace nada. */
function VolverAlMercado({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
      >
        <ArrowLeft size={18} aria-hidden /> Volver al mercado
      </Link>
    </div>
  );
}

export function Header({
  usuario,
}: {
  usuario: { nombre: string; apellido: string } | null;
}) {
  const pathname = usePathname();
  const enMisPaletas = pathname === "/mis-publicaciones";
  const enFeed = pathname === "/";
  const iniciales = usuario
    ? (`${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase() || "?")
    : "?";
  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() || "Mi cuenta" : "";

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E6E4DF" }}
    >
      {/* ponytail: franja propia arriba de todo. En el row principal el link de
          Instagram compite por ancho con Publicar/Mis paletas/avatar y en 320px
          los empuja fuera de pantalla. */}
      <div style={{ background: "#057305" }}>
        <div className="mx-auto flex max-w-[1280px] justify-end px-4 md:px-6">
          <a
            href="https://instagram.com/paletita.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 px-1 text-[13px] text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
            style={{ fontWeight: 600 }}
          >
            <IconoInstagram />
            @paletita.ar
            <span className="sr-only"> en Instagram (abre en una pestaña nueva)</span>
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3 sm:gap-3 md:gap-5 md:px-6">
        <Link
          href="/"
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: "#057305" }}
        >
          <Logo />
        </Link>

        {/* min-w-0: sin esto el flex item no baja de su ancho de contenido y empuja al header fuera de pantalla */}
        {enFeed ? (
          <Buscador id="buscar-desktop" className="hidden min-w-0 flex-1 md:block" />
        ) : (
          <VolverAlMercado className="hidden min-w-0 flex-1 md:block" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/publicar"
            className="flex h-11 min-h-[44px] w-11 items-center justify-center gap-1.5 rounded-full text-[14px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:rounded-[14px] sm:px-3.5"
            style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
          >
            <Plus size={18} aria-hidden />
            <span className="hidden sm:inline">Publicar</span>
            <span className="sr-only sm:hidden">Publicar paleta</span>
          </Link>

          {usuario ? (
            <>
              <Link
                href="/mis-publicaciones"
                aria-current={enMisPaletas ? "page" : undefined}
                className="flex h-11 min-h-[44px] w-11 items-center justify-center gap-1.5 rounded-full text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:rounded-[14px] sm:px-3"
                style={{
                  color: enMisPaletas ? "#057305" : "#5B6470",
                  background: enMisPaletas ? "#EAF4EA" : undefined,
                  fontWeight: 600,
                  outlineColor: "#057305",
                }}
              >
                <LayoutGrid size={18} aria-hidden />
                <span className="hidden sm:inline">Mis paletas</span>
                <span className="sr-only sm:hidden">Mis paletas</span>
              </Link>

              {/* ponytail: <details> nativo, sin JS ni click-afuera. Se cierra al
                  navegar o al volver a tocar el avatar. Si molesta quedar abierto,
                  el upgrade es un onBlur en el contenedor. */}
              <details className="relative">
                <summary
                  className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
                  style={{
                    background: "#F2F1ED",
                    border: "1px solid #E6E4DF",
                    color: "#057305",
                    fontWeight: 700,
                    outlineColor: "#057305",
                  }}
                >
                  <span aria-hidden>{iniciales}</span>
                  <span className="sr-only">Mi cuenta</span>
                </summary>

                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-[14px] p-1.5 shadow-lg"
                  style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
                >
                  <p className="px-3 py-2 text-[13px]" style={{ color: "#5B6470" }}>
                    {nombreCompleto}
                  </p>
                  <Link
                    href="/cuenta"
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
                  >
                    <UserRound size={16} aria-hidden /> Mi cuenta
                  </Link>
                  <form action={cerrarSesion}>
                    <button
                      type="submit"
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 text-left text-[14px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
                    >
                      <LogOut size={16} aria-hidden /> Cerrar sesión
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <Link
              href="/auth"
              className="flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "#5B6470", fontWeight: 600, outlineColor: "#057305" }}
            >
              <LogIn size={16} aria-hidden /> Ingresar
            </Link>
          )}
        </div>
      </div>

      {enFeed ? (
        <Buscador id="buscar-mobile" className="px-4 pb-3 md:hidden" />
      ) : (
        <VolverAlMercado className="px-4 pb-3 md:hidden" />
      )}
    </header>
  );
}
