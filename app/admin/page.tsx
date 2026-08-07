import { Metric } from "@/components/metric";
import { estadisticasAdmin, type Estadisticas } from "@/lib/admin-db";
import { formatPrecio } from "@/lib/paletas";

const MES = new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit" });

/** "2026-08" -> "ago 26". El dia 1 a mediodia para que no se corra de mes. */
const nombreMes = (mes: string) => MES.format(new Date(`${mes}-01T12:00:00`));

const numero = (n: number) => n.toLocaleString("es-AR");

/**
 * Barra proporcional debajo del numero. El dato real es el numero: la barra es
 * decorativa y va aria-hidden, si no el lector de pantalla lee ruido.
 */
function Barra({ valor, max }: { valor: number; max: number }) {
  const ancho = max > 0 ? (valor / max) * 100 : 0;
  return (
    <span
      aria-hidden
      className="mt-1 block h-1 w-full overflow-hidden rounded-full"
      style={{ background: "#F2F1ED" }}
    >
      <span
        className="block h-1 rounded-full"
        style={{ width: `${ancho}%`, background: "#0F5132" }}
      />
    </span>
  );
}

/**
 * ponytail: una <table> con barritas, sin libreria de graficos. No hay ninguna
 * instalada y para 12 filas x 3 series una tabla se lee mejor en un celular
 * que un grafico apretado, ademas de ser accesible sin trabajo extra.
 */
function Historico({ filas }: { filas: Estadisticas["historico"] }) {
  const maxPaletas = Math.max(...filas.map((f) => f.paletas), 1);
  const maxPromos = Math.max(...filas.map((f) => f.promociones), 1);
  const maxIngresos = Math.max(...filas.map((f) => f.ingresos), 1);

  return (
    <div
      className="overflow-x-auto rounded-[14px]"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
    >
      <table className="w-full text-[13px]">
        <caption className="px-4 pt-4 text-left text-[13px]" style={{ color: "#5B6470" }}>
          Últimos 12 meses
        </caption>
        <thead>
          <tr style={{ color: "#5B6470" }}>
            <th scope="col" className="px-4 py-2 text-left font-semibold">Mes</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Paletas</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Promos</th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.mes} style={{ borderTop: "1px solid #E6E4DF" }}>
              <th
                scope="row"
                className="whitespace-nowrap px-4 py-2.5 text-left font-normal"
                style={{ color: "#14171A" }}
              >
                {nombreMes(f.mes)}
              </th>
              <td className="px-3 py-2.5 text-right" style={{ color: "#14171A" }}>
                {numero(f.paletas)}
                <Barra valor={f.paletas} max={maxPaletas} />
              </td>
              <td className="px-3 py-2.5 text-right" style={{ color: "#14171A" }}>
                {numero(f.promociones)}
                <Barra valor={f.promociones} max={maxPromos} />
              </td>
              <td
                className="whitespace-nowrap px-4 py-2.5 text-right"
                style={{ color: "#0F5132", fontWeight: 600 }}
              >
                {formatPrecio(f.ingresos)}
                <Barra valor={f.ingresos} max={maxIngresos} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Page() {
  const e = await estadisticasAdmin();

  return (
    <div className="space-y-6">
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

      <Historico filas={e.historico} />
    </div>
  );
}
