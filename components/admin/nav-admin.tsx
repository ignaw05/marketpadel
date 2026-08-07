"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/publicaciones", texto: "Publicaciones" },
  { href: "/admin/usuarios", texto: "Usuarios" },
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
              background: activa ? "#0F5132" : "#FFFFFF",
              border: `1px solid ${activa ? "#0F5132" : "#E6E4DF"}`,
              color: activa ? "#FFFFFF" : "#14171A",
              fontWeight: 600,
              outlineColor: "#0F5132",
            }}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
