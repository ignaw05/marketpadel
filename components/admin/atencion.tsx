import Link from "next/link";
import { AlertTriangle, Check, Clock, ImageOff, CalendarX } from "lucide-react";
import type { Atencion as Datos } from "@/lib/admin-db";

const numero = (n: number) => n.toLocaleString("es-AR");

const plural = (n: number, una: string, muchas: string) =>
  `${numero(n)} ${n === 1 ? una : muchas}`;

/**
 * Cada fila es algo que se resuelve HACIENDO algo, y por eso todas linkean a
 * la lista ya filtrada: si no hay adonde ir, no es un accionable y no va aca.
 *
 * El orden es el de urgencia, no el de la RPC: primero la plata que no entro,
 * despues lo que ya se cayo del feed, despues lo que se va a caer.
 */
function filas(d: Datos) {
  return [
    {
      clave: "pagos",
      n: d.pagos_problema,
      Icono: AlertTriangle,
      grave: true,
      titulo: plural(d.pagos_problema, "pago sin cobrar", "pagos sin cobrar"),
      detalle: "Rechazados, devueltos o todavía pendientes en este período.",
      href: "/admin/dinero",
    },
    {
      clave: "vencidas",
      n: d.ya_vencidas,
      Icono: CalendarX,
      grave: true,
      titulo: plural(d.ya_vencidas, "publicación ya vencida", "publicaciones ya vencidas"),
      detalle: "Siguen en estado activa pero no las ve nadie.",
      href: "/admin/publicaciones?estado=vencidas",
    },
    {
      clave: "pronto",
      n: d.vencen_pronto,
      Icono: Clock,
      grave: false,
      titulo: `${plural(d.vencen_pronto, "publicación vence", "publicaciones vencen")} esta semana`,
      detalle: "Salen del feed solas si nadie las renueva.",
      href: "/admin/publicaciones?estado=vencen",
    },
    {
      clave: "sinfoto",
      n: d.sin_foto,
      Icono: ImageOff,
      grave: false,
      titulo: plural(d.sin_foto, "publicación sin foto", "publicaciones sin foto"),
      detalle: "Están en el feed con el placeholder.",
      href: "/admin/publicaciones?sinfoto=1",
    },
  ].filter((f) => f.n > 0);
}

export function Atencion({ datos }: { datos: Datos }) {
  const pendientes = filas(datos);

  return (
    <section aria-labelledby="atencion">
      <h2
        id="atencion"
        className="mb-2.5 text-[16px]"
        style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
      >
        Requiere atención
      </h2>

      {pendientes.length === 0 ? (
        // Estado vacio positivo: que no haya nada es una respuesta, no la
        // ausencia de una. Sin esto la seccion desaparece y no se sabe si esta
        // limpia o si se rompio.
        <div
          className="flex items-center gap-3.5 rounded-[14px] p-5"
          style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(5,115,5,0.1)", color: "#057305" }}
          >
            <Check size={20} aria-hidden />
          </span>
          <span>
            <span className="block text-[15px]" style={{ color: "#14171A", fontWeight: 600 }}>
              Nada requiere atención
            </span>
            <span className="mt-0.5 block text-[13px]" style={{ color: "#5B6470" }}>
              No hay publicaciones vencidas ni por vencer, todas tienen foto y no
              quedaron pagos trabados.
            </span>
          </span>
        </div>
      ) : (
        <ul
          className="overflow-hidden rounded-[14px]"
          style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {pendientes.map(({ clave, Icono, grave, titulo, detalle, href }, i) => (
            <li key={clave} style={i > 0 ? { borderTop: "1px solid #E6E4DF" } : undefined}>
              <Link
                href={href}
                className="flex min-h-[56px] items-center gap-3 p-3 px-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
                style={{ color: "#14171A", outlineColor: "#057305" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={
                    grave
                      ? { background: "rgba(212,24,61,0.08)", color: "#D4183D" }
                      : { background: "#F2F1ED", color: "#5B6470" }
                  }
                >
                  <Icono size={17} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px]" style={{ fontWeight: 600 }}>
                    {titulo}
                  </span>
                  <span className="block text-[12px]" style={{ color: "#5B6470" }}>
                    {detalle}
                  </span>
                </span>
                {/* El chevron es decorativo: el <Link> entero ya es el target. */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5B6470"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
