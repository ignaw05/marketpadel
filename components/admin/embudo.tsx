import Link from "next/link";
import { ArrowDown } from "lucide-react";
import type { Gente } from "@/lib/admin-db";
import { porcentaje } from "@/lib/panel";

const numero = (n: number) => n.toLocaleString("es-AR");

/**
 * El embudo cuenta PERSONAS distintas en cada escalon, no eventos, y los
 * escalones no son subconjuntos estrictos: se puede vender sin haber
 * promocionado nunca. Por eso entre dos escalones se escribe "siguió", que es
 * una comparacion, y no "se perdieron", que seria una particion.
 */
export function Embudo({ datos }: { datos: Gente }) {
  const { embudo } = datos;
  const pasos = [
    { texto: "Se registraron", n: embudo.registrados },
    { texto: "Publicaron una paleta", n: embudo.publicaron },
    { texto: "Pagaron una promoción", n: embudo.promocionaron },
    { texto: "Vendieron", n: embudo.vendieron },
  ];
  const tope = embudo.registrados;

  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <h3 className="text-[13px]" style={{ color: "#5B6470" }}>
        De registrarse a vender
      </h3>
      <p
        className="mt-0.5 text-[22px]"
        style={{ color: "#057305", fontWeight: 800, letterSpacing: "-0.025em" }}
      >
        {numero(embudo.registrados)} {embudo.registrados === 1 ? "persona" : "personas"}
      </p>

      <dl className="mt-4">
        {pasos.map((paso, i) => {
          const previo = i > 0 ? pasos[i - 1].n : null;
          const siguio = previo !== null ? porcentaje(paso.n, previo) : null;
          return (
            <div key={paso.texto}>
              {previo !== null && (
                <div
                  className="flex items-center gap-1.5 py-1.5 pl-2.5 text-[12px]"
                  style={{ color: "#5B6470" }}
                >
                  <ArrowDown size={13} aria-hidden />
                  {siguio !== null ? `${siguio}% siguió` : "Sin nadie en el paso anterior"}
                  {/* El escalon mas caro se nombra, no se deja deducir. */}
                  {i === 1 && datos.sin_publicar > 0 && (
                    <>
                      {" · "}
                      <Link
                        href="/admin/usuarios"
                        style={{ color: "#D4183D", fontWeight: 600 }}
                      >
                        {numero(datos.sin_publicar)} nunca publicaron
                      </Link>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
                  {paso.texto}
                </dt>
                <dd
                  className="shrink-0 text-[15px] tabular-nums"
                  style={{ color: "#14171A", fontWeight: 700 }}
                >
                  {numero(paso.n)}
                </dd>
              </div>
              <span
                aria-hidden
                className="mt-1.5 block h-[30px] w-full overflow-hidden rounded-[10px]"
                style={{ background: "#F2F1ED" }}
              >
                {paso.n > 0 && (
                  <span
                    className="block h-[30px] rounded-[10px]"
                    style={{
                      width: `${tope > 0 ? Math.max((paso.n / tope) * 100, 2) : 0}%`,
                      background: "#057305",
                    }}
                  />
                )}
              </span>
            </div>
          );
        })}
      </dl>

      {datos.pro_vigentes > 0 && (
        <p
          className="mt-4 border-t pt-3 text-[12px]"
          style={{ borderColor: "#E6E4DF", color: "#5B6470" }}
        >
          {numero(datos.pro_vigentes)}{" "}
          {datos.pro_vigentes === 1 ? "perfil tiene" : "perfiles tienen"} Vendedor Pro vigente.
        </p>
      )}
    </div>
  );
}

export function TopVendedores({ datos }: { datos: Gente }) {
  if (datos.top_vendedores.length === 0) return null;

  return (
    <section aria-labelledby="top-vendedores">
      <h2
        id="top-vendedores"
        className="mb-2.5 text-[16px]"
        style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
      >
        Quiénes sostienen el catálogo
      </h2>
      <ol
        className="overflow-hidden rounded-[14px]"
        style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {datos.top_vendedores.map((v, i) => (
          <li key={v.id} style={i > 0 ? { borderTop: "1px solid #E6E4DF" } : undefined}>
            <Link
              href={`/admin/publicaciones?vendedor=${v.id}`}
              className="flex min-h-[56px] items-center gap-3 p-3 px-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
              style={{ color: "#14171A", outlineColor: "#057305" }}
            >
              <span
                className="w-6 shrink-0 text-center text-[13px] tabular-nums"
                style={{ color: "#5B6470", fontWeight: 700 }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px]" style={{ fontWeight: 600 }}>
                  {v.nombre}
                </span>
                <span className="block text-[12px]" style={{ color: "#5B6470" }}>
                  {numero(v.paletas)} {v.paletas === 1 ? "publicación" : "publicaciones"} ·{" "}
                  {numero(v.vendidas)} {v.vendidas === 1 ? "vendida" : "vendidas"} ·{" "}
                  {numero(v.visitas)} visitas
                </span>
              </span>
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
      </ol>
    </section>
  );
}
