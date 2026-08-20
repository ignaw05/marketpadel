import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, Star, Columns2, MapPin } from "lucide-react";
import { BotonPro } from "@/components/boton-pro";
import { miPlan } from "@/lib/pro-db";
import { PLAN_PRO, esPro } from "@/lib/pro";
import { PLANES, formatPrecio } from "@/lib/paletas";

const TITULO = "Vendedor Pro";
const DESCRIPCION = `Distintivo en todas tus paletas, ${PLAN_PRO.creditos} promociones de ${PLAN_PRO.diasPromo} días por mes y tu propia cartelera. ${formatPrecio(PLAN_PRO.precio)} por mes.`;

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/pro" },
  openGraph: { title: TITULO, description: DESCRIPCION, url: "/pro" },
};

/** Lo que costarían sueltas las promociones que incluye el plan. */
const VALOR_PROMOS =
  PLAN_PRO.creditos * (PLANES.find((p) => p.dias === PLAN_PRO.diasPromo)?.precio ?? 0);

function Punto({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check size={20} strokeWidth={2.5} className="mt-0.5 shrink-0" style={{ color: "#057305" }} aria-hidden />
      <p className="text-[14px]" style={{ color: "#14171A", lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700 }}>{titulo}</span>{" "}
        <span style={{ color: "#5B6470" }}>{children}</span>
      </p>
    </li>
  );
}

export default async function Page() {
  const plan = await miPlan();
  const activo = esPro(plan.hasta);

  return (
    <div className="mx-auto max-w-[560px] pb-8">
      {/* Hero en bloque de marca. Es la única pantalla con color a sangre: es una
          landing de venta y tiene que frenar el scroll. */}
      <div className="flex flex-col gap-3.5 px-4 py-7 md:px-6" style={{ background: "#057305" }}>
        <span
          className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
          style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
        >
          <BadgeCheck size={12} aria-hidden /> Vendedor Pro
        </span>

        <h1
          className="text-[32px] md:text-[38px]"
          style={{ color: "#FFFFFF", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em" }}
        >
          Que se note quién vende en serio
        </h1>
        <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.5 }}>
          El comprador ve el distintivo antes de escribirte. Menos preguntas, menos desconfianza,
          más ventas cerradas.
        </p>

        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span
            className="text-[38px]"
            style={{ color: "#C7F751", fontWeight: 800, letterSpacing: "-0.035em" }}
          >
            {formatPrecio(PLAN_PRO.precio)}
          </span>
          <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>
            por mes
          </span>
        </p>

        {activo ? (
          <Link
            href="/cuenta"
            className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[16px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: "#C7F751",
              color: "#14171A",
              fontWeight: 700,
              letterSpacing: "-0.015em",
              outlineColor: "#FFFFFF",
            }}
          >
            Ya sos Pro — ver mi plan
          </Link>
        ) : (
          <BotonPro variante="lima" />
        )}

        <p className="text-center text-[12px]" style={{ color: "rgba(255,255,255,0.75)" }}>
          Mes a mes. Sin débito automático ni permanencia.
        </p>
      </div>

      {/* La prueba: la card real, con la cinta puesta. */}
      <section className="px-4 pt-6 md:px-6">
        <h2
          className="text-[19px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Así queda tu publicación
        </h2>
        <div className="mt-3 flex items-start gap-3">
          <div
            className="flex w-[150px] shrink-0 flex-col overflow-hidden rounded-[14px]"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E4DF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ background: "#F2F1ED", aspectRatio: "4 / 5" }}
            >
              <svg width="44" height="80" viewBox="0 0 52 96" fill="none" stroke="#C9C6BF" strokeWidth="3" aria-hidden>
                <ellipse cx="26" cy="30" rx="24" ry="28" />
                <path d="M20 58 h12 v26 a6 6 0 0 1-6 6 a6 6 0 0 1-6-6 z" />
              </svg>
              <span
                className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
              >
                9/10
              </span>
              <p
                className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px]"
                style={{ background: "rgba(5,115,5,0.94)", color: "#FFFFFF", fontWeight: 700 }}
              >
                <BadgeCheck size={13} aria-hidden className="shrink-0" />
                <span className="truncate">Tu nombre</span>
              </p>
            </div>
            <div className="p-3">
              <p className="truncate text-[13px]" style={{ color: "#14171A", fontWeight: 600 }}>
                Bullpadel Vertex 04
              </p>
              <p className="mt-1 text-[17px]" style={{ color: "#057305", fontWeight: 700 }}>
                {formatPrecio(285000)}
              </p>
              <p
                className="mt-1 flex items-center gap-1 text-[12px]"
                style={{ color: "#5B6470" }}
              >
                <MapPin size={12} aria-hidden /> Tu ciudad
              </p>
            </div>
          </div>
          <p className="text-[14px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
            El distintivo con tu nombre va en todas tus paletas, en el listado y en la ficha.
            También en las que publiques más adelante.
          </p>
        </div>
      </section>

      <section className="px-4 pt-6 md:px-6">
        <h2
          className="text-[19px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Qué más incluye
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          <Punto titulo={`${PLAN_PRO.creditos} promociones de ${PLAN_PRO.diasPromo} días por mes.`}>
            <Star size={13} className="inline align-[-1px]" aria-hidden /> Elegís vos cuáles. Sueltas
            te saldrían {formatPrecio(VALOR_PROMOS)}. Se renuevan cada mes y no se acumulan.
          </Punto>
          <Punto titulo="Tu propia cartelera.">
            <Columns2 size={13} className="inline align-[-1px]" aria-hidden /> Una fila sola para vos
            en{" "}
            <Link href="/vendedores" style={{ color: "#057305", fontWeight: 600 }}>
              Vendedores Pro
            </Link>
            , con todo tu catálogo junto en vez de disperso por el feed.
          </Punto>
          <Punto titulo="Lo cortás cuando quieras.">
            Si un mes no lo pagás, simplemente no se renueva. Tus publicaciones siguen ahí.
          </Punto>
        </ul>
      </section>

      <div className="px-4 pt-6 md:px-6">
        <p
          className="rounded-[14px] p-4 text-[13px]"
          style={{ background: "#F2F1ED", color: "#5B6470", lineHeight: 1.5 }}
        >
          Pro es un plan pago, no una verificación de identidad. Revisá siempre a quién le comprás.
        </p>
      </div>
    </div>
  );
}
