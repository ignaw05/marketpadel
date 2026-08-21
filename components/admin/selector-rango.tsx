import Link from "next/link";
import { RANGOS, type Rango } from "@/lib/admin-db";

const ETIQUETA: Record<Rango, string> = {
  dia: "Diario",
  semana: "Semanal",
  mes: "Mensual",
  anio: "Anual",
  total: "Total",
};

/** Que ventana mira cada rango. Va debajo del selector para que el eje no sorprenda. */
const VENTANA: Record<Rango, string> = {
  dia: "Últimos 30 días, un punto por día.",
  semana: "Últimas 12 semanas, un punto por semana.",
  mes: "Últimos 12 meses, un punto por mes.",
  anio: "Últimos 5 años, un punto por año.",
  total: "Todo el historial, un punto por mes.",
};

/** La aclaración de la ventana, con la del período anterior cuando hay. */
export function leyendaRango(rango: Rango): string {
  return rango === "total"
    ? `${VENTANA[rango]} Sin período anterior contra el que comparar.`
    : `${VENTANA[rango]} Las variaciones comparan contra la ventana anterior del mismo tamaño.`;
}

/**
 * El rango vive en la URL y no en un useState: asi el back del navegador
 * funciona, el link se puede compartir y la pantalla sigue siendo un Server
 * Component. Son <Link>, no botones: cambian de pagina.
 *
 * `base` porque lo usan /admin y /admin/dinero, que tienen que conservar cada
 * uno su propia ruta al cambiar de rango.
 */
export function SelectorRango({ actual, base }: { actual: Rango; base: string }) {
  return (
    <div>
      <nav aria-label="Rango del resumen" className="flex gap-2 overflow-x-auto">
        {RANGOS.map((r) => {
          const activo = r === actual;
          return (
            <Link
              key={r}
              href={`${base}?rango=${r}`}
              aria-current={activo ? "true" : undefined}
              className="flex min-h-[44px] shrink-0 items-center rounded-[14px] px-4 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: activo ? "#057305" : "#FFFFFF",
                border: `1px solid ${activo ? "#057305" : "#E6E4DF"}`,
                color: activo ? "#FFFFFF" : "#14171A",
                fontWeight: 600,
                outlineColor: "#057305",
              }}
            >
              {ETIQUETA[r]}
            </Link>
          );
        })}
      </nav>
      <p className="mt-2 text-[13px]" style={{ color: "#5B6470" }}>
        {leyendaRango(actual)}
      </p>
    </div>
  );
}
