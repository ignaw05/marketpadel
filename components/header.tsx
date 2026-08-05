"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Plus, LayoutGrid, LogOut, LogIn } from "lucide-react";
import { Logo } from "./logo";
import { cerrarSesion } from "@/app/auth/actions";

const OTROS_FILTROS = ["marca", "forma", "ciudad", "precioMax", "estado"];

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
            outlineColor: "#0F5132",
          }}
        />
      </div>
    </form>
  );
}

export function Header({
  usuario,
}: {
  usuario: { nombre: string; apellido: string } | null;
}) {
  const pathname = usePathname();
  const enMisPaletas = pathname === "/mis-publicaciones";
  const iniciales = usuario
    ? (`${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase() || "?")
    : "?";
  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() || "Mi cuenta" : "";

  return (
    <header
      className="sticky top-0 z-30"
      style={{ background: "#FFFFFF", borderBottom: "1px solid #E6E4DF" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3 sm:gap-3 md:gap-5 md:px-6">
        <Link
          href="/"
          className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: "#0F5132" }}
        >
          <Logo />
        </Link>

        {/* min-w-0: sin esto el flex item no baja de su ancho de contenido y empuja al header fuera de pantalla */}
        <Buscador id="buscar-desktop" className="hidden min-w-0 flex-1 md:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {usuario && (
            <Link
              href="/mis-publicaciones"
              aria-current={enMisPaletas ? "page" : undefined}
              className="hidden min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex"
              style={{
                color: enMisPaletas ? "#0F5132" : "#5B6470",
                fontWeight: 600,
                outlineColor: "#0F5132",
              }}
            >
              <LayoutGrid size={16} aria-hidden /> Mis paletas
            </Link>
          )}

          {!usuario && (
            <Link
              href="/auth"
              className="flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "#5B6470", fontWeight: 600, outlineColor: "#0F5132" }}
            >
              <LogIn size={16} aria-hidden /> Ingresar
            </Link>
          )}

          <Link
            href="/publicar"
            className="flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3.5 py-2 text-[14px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
          >
            <Plus size={16} aria-hidden /> <span className="hidden sm:inline">Publicar</span>
          </Link>

          {usuario && (
            <>
              <Link
                href="/mis-publicaciones"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: "#0F5132", fontWeight: 700, outlineColor: "#0F5132" }}
              >
                <span aria-hidden>{iniciales}</span>
                <span className="sr-only">{nombreCompleto}</span>
              </Link>

              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ color: "#5B6470", outlineColor: "#0F5132" }}
                >
                  <LogOut size={18} aria-hidden />
                  <span className="sr-only">Cerrar sesión</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Buscador id="buscar-mobile" className="px-4 pb-3 md:hidden" />
    </header>
  );
}
