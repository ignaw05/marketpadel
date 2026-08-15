import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Metric } from "@/components/metric";
import { GraficoSerie, GraficoTipos } from "@/components/admin/grafico";
import {
  estadisticasAdmin,
  rangoActual,
  RANGOS,
  type Rango,
} from "@/lib/admin-db";
import { formatPrecio } from "@/lib/paletas";

const numero = (n: number) => n.toLocaleString("es-AR");

const ETIQUETA_RANGO: Record<Rango, string> = {
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

/**
 * El rango vive en la URL y no en un useState: asi el back del navegador
 * funciona, el link se puede compartir y la pantalla sigue siendo un Server
 * Component. Son <Link>, no botones: cambian de pagina.
 */
function SelectorRango({ actual }: { actual: Rango }) {
  return (
    <nav aria-label="Rango del resumen" className="flex gap-2 overflow-x-auto">
      {RANGOS.map((r) => {
        const activo = r === actual;
        return (
          <Link
            key={r}
            href={`/admin?rango=${r}`}
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
            {ETIQUETA_RANGO[r]}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Visitas al sitio. No hay grafico porque no hay dato: la base no guarda
 * pageviews. @vercel/analytics ya los mide, asi que el panel manda al lugar
 * donde estan en vez de duplicar el tracking.
 *
 * VERCEL_ANALYTICS_URL es el link directo al proyecto
 * (vercel.com/<equipo>/<proyecto>/analytics). Sin la variable, al dashboard.
 */
function Visitas() {
  const url = process.env.VERCEL_ANALYTICS_URL ?? "https://vercel.com/dashboard";

  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
    >
      <h3 className="text-[13px]" style={{ color: "#5B6470" }}>
        Visitas al sitio
      </h3>
      <p className="mt-1 text-[14px]" style={{ color: "#14171A" }}>
        Cuánta gente entra a la página lo mide Vercel Analytics, no esta base.
        Ahí están visitantes únicos, páginas vistas y de dónde vienen, con el
        mismo corte por día, semana y mes.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: "#FFFFFF",
          border: "1px solid #057305",
          color: "#057305",
          fontWeight: 600,
          outlineColor: "#057305",
        }}
      >
        Abrir Vercel Analytics
        <ExternalLink size={15} aria-hidden />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </a>
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const rango = rangoActual((await searchParams).rango);
  const e = await estadisticasAdmin(rango);

  return (
    <div className="space-y-6">
      {/* Totales de siempre: no dependen del rango, por eso van arriba del selector. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric
          label="Ganancia total"
          value={formatPrecio(e.ganancia)}
          detalle="Bruto, sin descontar MercadoPago"
        />
        <Metric
          label="Paletas publicadas"
          value={numero(e.paletas.activas)}
          detalle={`${numero(e.paletas.total)} en total`}
        />
        <Metric
          label="Vendidas"
          value={numero(e.paletas.vendidas)}
          detalle={`${numero(e.paletas.pausadas)} pausadas`}
        />
        <Metric
          label="Promociones activas"
          value={numero(e.promociones.activas)}
          detalle={`${numero(e.promociones.total)} desde siempre`}
        />
        <Metric
          label="Usuarios"
          value={numero(e.usuarios.total)}
          detalle={`${numero(e.usuarios.baneados)} baneados`}
        />
        <Metric
          label="Dadas de baja"
          value={numero(e.paletas.bajas)}
          detalle={`${numero(e.paletas.vencidas)} vencidas`}
        />
      </div>

      <div>
        <SelectorRango actual={rango} />
        <p className="mt-2 text-[13px]" style={{ color: "#5B6470" }}>
          {VENTANA[rango]}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <GraficoSerie
          titulo="Publicaciones nuevas"
          datos={e.serie}
          unidad={e.unidad}
          campo="paletas"
        />
        <GraficoSerie
          titulo="Ingresos"
          datos={e.serie}
          unidad={e.unidad}
          campo="ingresos"
          moneda
          nota="Bruto de los pagos aprobados, sin descontar MercadoPago."
        />
        <GraficoSerie
          titulo="Promociones"
          datos={e.serie}
          unidad={e.unidad}
          campo="promociones"
        />
        <GraficoTipos tipos={e.tipos} />
        <GraficoSerie
          titulo="Usuarios nuevos"
          datos={e.serie}
          unidad={e.unidad}
          campo="usuarios"
        />
        <GraficoSerie
          titulo="Usuarios activos"
          datos={e.serie}
          unidad={e.unidad}
          campo="activos"
          nota="Personas distintas que publicaron, pagaron o promocionaron. No cuenta las que solo miran."
        />
      </div>

      <Visitas />
    </div>
  );
}
