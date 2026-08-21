import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Metric } from "@/components/metric";
import { Ranking, Histograma, GraficoDesglose } from "@/components/admin/grafico";
import { panelCatalogo, type FilaRanking } from "@/lib/admin-db";
import { porcentaje } from "@/lib/panel";
import { formatPrecio } from "@/lib/paletas";

const numero = (n: number) => n.toLocaleString("es-AR");

/** Las filas plegadas ("Otras marcas") dicen cuantas juntaron, y van en gris. */
const aFilas = (filas: FilaRanking[], una: string, muchas: string) =>
  filas.map((f) => ({
    texto:
      f.agrupadas === null
        ? f.nombre
        : `${f.nombre} (${numero(f.agrupadas)} ${f.agrupadas === 1 ? una : muchas})`,
    valor: f.n,
    plegada: f.agrupadas !== null,
  }));

export default async function Page() {
  const c = await panelCatalogo();

  if (c.total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center"
        style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "#F2F1ED" }}
        >
          <PackageOpen size={28} style={{ color: "#057305" }} aria-hidden />
        </div>
        <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
          Todavía no hay ninguna publicación
        </p>
        <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
          Cuando alguien publique una paleta, acá vas a ver de qué marcas son,
          de dónde y a qué precio.
        </p>
      </div>
    );
  }

  const permuta = porcentaje(c.permuta.si, c.permuta.activas);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Precio promedio"
          value={c.precio.promedio !== null ? formatPrecio(c.precio.promedio) : "—"}
          detalle={
            c.precio.mediana !== null ? `Mediana ${formatPrecio(c.precio.mediana)}` : undefined
          }
        />
        <Metric
          label="Días hasta la venta"
          value={
            c.dias_hasta_venta.promedio !== null
              ? c.dias_hasta_venta.promedio.toLocaleString("es-AR")
              : "—"
          }
          detalle={
            c.dias_hasta_venta.mediana !== null
              ? `Mediana ${c.dias_hasta_venta.mediana.toLocaleString("es-AR")}`
              : "Todavía no se vendió ninguna"
          }
        />
        <Metric
          label="Visitas totales"
          value={numero(c.visitas.total)}
          detalle={
            c.visitas.promedio !== null
              ? `${c.visitas.promedio.toLocaleString("es-AR")} por publicación`
              : undefined
          }
        />
        <Metric
          label="Aceptan permuta"
          value={numero(c.permuta.si)}
          detalle={
            permuta !== null ? `${permuta}% de las activas` : "Sin publicaciones activas"
          }
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Ranking
          titulo="Marcas más publicadas"
          total={numero(c.total)}
          vacio="Todavía no hay publicaciones."
          nota="Top 8. El resto va junto en la última fila."
          filas={aFilas(c.marcas, "marca", "marcas")}
        />
        <Ranking
          titulo="Dónde están las paletas"
          total={numero(c.total)}
          vacio="Todavía no hay publicaciones."
          nota="Provincia que cargó el vendedor en la publicación."
          filas={aFilas(c.provincias, "provincia", "provincias")}
        />
        <Ranking
          titulo="Distribución de precios"
          total={
            c.precio.min !== null && c.precio.max !== null
              ? `${formatPrecio(c.precio.min)} – ${formatPrecio(c.precio.max)}`
              : "—"
          }
          vacio="Todavía no hay publicaciones."
          nota={
            c.precio_vendidas !== null
              ? `Las vendidas promediaron ${formatPrecio(c.precio_vendidas)}.`
              : undefined
          }
          filas={[
            { texto: "Menos de $ 100.000", valor: c.precios.b1 },
            { texto: "$ 100.000 – $ 200.000", valor: c.precios.b2 },
            { texto: "$ 200.000 – $ 300.000", valor: c.precios.b3 },
            { texto: "$ 300.000 – $ 500.000", valor: c.precios.b4 },
            { texto: "Más de $ 500.000", valor: c.precios.b5 },
          ]}
        />
        <GraficoDesglose
          titulo="Formas"
          vacio="Todavía no hay publicaciones."
          filas={[
            { texto: "Diamante", valor: c.formas.diamante },
            { texto: "Lágrima", valor: c.formas.lagrima },
            { texto: "Redonda", valor: c.formas.redonda },
          ]}
        />
        <div className="md:col-span-2">
          <Histograma
            titulo="Estado declarado"
            total={numero(c.total)}
            nota="Del 1 al 10, como lo puso el vendedor al publicar."
            vacio="Todavía no hay publicaciones."
            barras={c.estado.map((e) => ({ etiqueta: String(e.valor), valor: e.n }))}
          />
        </div>
      </div>

      <section aria-labelledby="miradas">
        <h2
          id="miradas"
          className="mb-2.5 text-[16px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Las más miradas
        </h2>
        {c.top_visitas.length === 0 ? (
          <div
            className="rounded-[14px] py-14 text-center"
            style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
          >
            <p className="text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
              Todavía nadie abrió una publicación
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
              El contador sube cuando alguien entra al detalle de una paleta.
            </p>
          </div>
        ) : (
          <ol
            className="overflow-hidden rounded-[14px]"
            style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {c.top_visitas.map((p, i) => (
              <li key={p.id} style={i > 0 ? { borderTop: "1px solid #E6E4DF" } : undefined}>
                <Link
                  href={`/paletas/${p.id}`}
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
                      {p.marca} {p.modelo}
                    </span>
                    <span className="block text-[12px]" style={{ color: "#5B6470" }}>
                      {p.provincia} · {formatPrecio(p.precio)}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[15px] tabular-nums"
                    style={{ color: "#057305", fontWeight: 700 }}
                  >
                    {numero(p.visitas)}
                    <span className="sr-only"> visitas</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
