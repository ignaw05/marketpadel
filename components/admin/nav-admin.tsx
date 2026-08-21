"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/dinero", texto: "Dinero" },
  { href: "/admin/catalogo", texto: "Catálogo" },
  { href: "/admin/publicaciones", texto: "Publicaciones" },
  { href: "/admin/usuarios", texto: "Usuarios" },
  { href: "/admin/sponsors", texto: "Sponsors" },
];

export function NavAdmin() {
  const path = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="flex gap-2 overflow-x-auto">
      {SECCIONES.map(({ href, texto }) => {
        // "/admin" solo matchea exacto: si no, queda activa en todas las subrutas.
        const activa = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className="flex min-h-[44px] shrink-0 items-center rounded-[14px] px-4 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: activa ? "#057305" : "#FFFFFF",
              border: `1px solid ${activa ? "#057305" : "#E6E4DF"}`,
              color: activa ? "#FFFFFF" : "#14171A",
              fontWeight: 600,
              outlineColor: "#057305",
            }}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
