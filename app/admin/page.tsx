import { ExternalLink } from "lucide-react";
import { Metric } from "@/components/metric";
import { GraficoSerie } from "@/components/admin/grafico";
import { SelectorRango } from "@/components/admin/selector-rango";
import { Atencion } from "@/components/admin/atencion";
import { panelResumen, rangoActual } from "@/lib/admin-db";
import { variacion, porcentaje } from "@/lib/panel";
import { formatPrecio } from "@/lib/paletas";

const numero = (n: number) => n.toLocaleString("es-AR");

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
  const e = await panelResumen(rango);

  const tasaVenta = porcentaje(e.totales.vendidas, e.totales.total);
  const visitaPorPaleta = e.totales.total
    ? Math.round(e.totales.visitas / e.totales.total)
    : 0;

  return (
    <div className="space-y-6">
      <SelectorRango actual={rango} base="/admin" />

      {/* El orden es el de la pregunta que responden: cuanta plata entro, como
          esta el catalogo, cuanta gente hay. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric
          label="Ingresos"
          value={formatPrecio(e.periodo.ingresos)}
          detalle={`${formatPrecio(e.ganancia)} desde siempre`}
          variacion={variacion(e.periodo.ingresos, e.anterior?.ingresos ?? null)}
          deltaTexto={formatPrecio(
            Math.abs(e.periodo.ingresos - (e.anterior?.ingresos ?? 0)),
          )}
        />
        <Metric
          label="Publicaciones activas"
          value={numero(e.totales.activas)}
          detalle={`${numero(e.totales.total)} en total, ${numero(e.totales.pausadas)} pausadas`}
        />
        <Metric
          label="Vendidas"
          value={numero(e.totales.vendidas)}
          detalle={[
            tasaVenta !== null ? `${tasaVenta}% del catálogo` : null,
            e.dias_hasta_venta !== null
              ? `${e.dias_hasta_venta.toLocaleString("es-AR")} días promedio`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <Metric
          label="Usuarios"
          value={numero(e.usuarios)}
          detalle={`${numero(e.periodo.usuarios)} nuevos en el período`}
          variacion={variacion(e.periodo.usuarios, e.anterior?.usuarios ?? null)}
          deltaTexto={numero(
            Math.abs(e.periodo.usuarios - (e.anterior?.usuarios ?? 0)),
          )}
          deltaNota="nuevos vs. período anterior"
        />
        <Metric
          label="Promociones vigentes"
          value={numero(e.promociones_vigentes)}
          detalle={`${numero(e.periodo.promociones)} abiertas en el período`}
        />
        <Metric
          label="Visitas al catálogo"
          value={numero(e.totales.visitas)}
          detalle={`${numero(visitaPorPaleta)} por publicación`}
        />
      </div>

      <Atencion datos={e.atencion} />

      <section aria-labelledby="tendencia">
        <h2
          id="tendencia"
          className="mb-2.5 text-[16px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Tendencia
        </h2>
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
      </section>

      <Visitas />
    </div>
  );
}
