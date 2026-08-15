// Graficos del panel. Server Components: SVG plano, sin estado y sin JS en el
// cliente.
//
// ponytail: sin libreria de graficos. Ninguna esta instalada y lo que hace
// falta son barras verticales y barras horizontales; recharts entero pesa mas
// que toda esta pantalla. El tooltip es un <title> nativo del SVG, que ademas
// lo leen los lectores de pantalla gratis, y el dato exacto siempre esta
// disponible en la tabla del <details>.
import type { PuntoSerie, Estadisticas } from "@/lib/admin-db";
import { formatPrecio } from "@/lib/paletas";

const numero = (n: number) => n.toLocaleString("es-AR");

const TINTA = "#14171A";
const TENUE = "#5B6470";
const LINEA = "#E6E4DF";
const VERDE = "#057305";

// Formateadores por unidad de bucket. Se crean una vez, no por fila.
//
// timeZone UTC NO ES OPCIONAL: `periodo` ya viene recortado a hora argentina
// por la RPC, o sea es una fecha pelada. Sin fijar el huso, el servidor (que en
// Vercel corre en UTC) y el navegador la interpretarian distinto y el 1 de
// agosto se mostraria como 31 de julio.
const FMT: Record<Estadisticas["unidad"], Intl.DateTimeFormat> = {
  day: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }),
  week: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }),
  month: new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }),
  year: new Intl.DateTimeFormat("es-AR", { year: "numeric", timeZone: "UTC" }),
};

/** "2026-08-12" -> "12 ago". */
export function etiquetaPeriodo(periodo: string, unidad: Estadisticas["unidad"]) {
  const t = FMT[unidad].format(new Date(`${periodo}T00:00:00Z`));
  return unidad === "week" ? `sem. del ${t}` : t;
}

// Coordenadas del SVG. El viewBox escala con el contenedor; a lo ancho de un
// celular queda casi 1:1, asi que los tamanos se leen como px.
const ANCHO = 320;
const ALTO = 108;
const PISO = ALTO - 14; // 14 abajo para las etiquetas del eje
const TECHO = 16; // 16 arriba para la etiqueta del maximo

/**
 * Barra con las esquinas de arriba redondeadas y las de abajo al ras del eje.
 * Un `rect rx` redondearia tambien la base y despegaria la barra de la linea.
 */
function barra(x: number, ancho: number, alto: number) {
  const r = Math.min(3, ancho / 2, alto);
  const y = PISO - alto;
  return `M${x},${PISO}V${y + r}a${r},${r} 0 0 1 ${r},${-r}h${ancho - 2 * r}a${r},${r} 0 0 1 ${r},${r}V${PISO}Z`;
}

function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex h-[108px] items-center justify-center text-center text-[13px]"
      style={{ color: TENUE }}
    >
      {children}
    </p>
  );
}

/**
 * Una metrica a lo largo del tiempo. Serie unica: sin leyenda, el titulo la
 * nombra.
 */
export function GraficoSerie({
  titulo,
  datos,
  unidad,
  campo,
  moneda = false,
  nota,
}: {
  titulo: string;
  datos: PuntoSerie[];
  unidad: Estadisticas["unidad"];
  campo: Exclude<keyof PuntoSerie, "periodo">;
  /** Formatea los valores como pesos en vez de como cantidad. */
  moneda?: boolean;
  /** Aclaracion debajo del titulo, para lo que el numero solo no explica. */
  nota?: string;
}) {
  const valores = datos.map((d) => d[campo]);
  const fmt = moneda ? formatPrecio : numero;
  const total = valores.reduce((a, v) => a + v, 0);
  const max = Math.max(...valores, 0);

  // 2px de aire entre barras: sin el, dos barras altas contiguas se leen como
  // una sola.
  const paso = ANCHO / datos.length;
  const ancho = Math.max(paso - 2, 1);
  const iMax = valores.indexOf(max);

  return (
    <figure
      className="m-0 rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: `1px solid ${LINEA}` }}
    >
      <figcaption>
        <h3 className="text-[13px]" style={{ color: TENUE }}>
          {titulo}
        </h3>
        <p className="mt-0.5 text-[22px]" style={{ color: VERDE, fontWeight: 800 }}>
          {fmt(total)}
        </p>
        {nota && (
          <p className="mt-0.5 text-[12px]" style={{ color: TENUE }}>
            {nota}
          </p>
        )}
      </figcaption>

      {total === 0 ? (
        <Vacio>Sin movimientos en este período.</Vacio>
      ) : (
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="mt-3 block h-auto w-full"
          role="img"
          aria-label={`${titulo}: ${fmt(total)} en el período. Máximo ${fmt(max)} en ${etiquetaPeriodo(datos[iMax].periodo, unidad)}.`}
        >
          {/* Eje: una linea fina y nada mas. La grilla completa compite con los datos. */}
          <line x1="0" y1={PISO} x2={ANCHO} y2={PISO} stroke={LINEA} strokeWidth="1" />

          {datos.map((d, i) => {
            const alto = max > 0 ? (d[campo] / max) * (PISO - TECHO) : 0;
            // Un periodo en 0 no dibuja barra: una barra minima fingiria
            // actividad que no hubo. El dato esta igual en la tabla de abajo.
            if (alto <= 0) return null;
            return (
              <path key={d.periodo} d={barra(i * paso, ancho, alto)} fill={VERDE}>
                <title>{`${etiquetaPeriodo(d.periodo, unidad)}: ${fmt(d[campo])}`}</title>
              </path>
            );
          })}

          {/* Etiqueta directa solo en el maximo: un numero por barra es ruido. */}
          <text
            x={Math.min(Math.max(iMax * paso + ancho / 2, 20), ANCHO - 20)}
            y={PISO - (PISO - TECHO) - 5}
            textAnchor="middle"
            fontSize="10"
            fill={TINTA}
            fontWeight="600"
          >
            {fmt(max)}
          </text>

          {/* Extremos del eje x. Etiquetar todos los buckets los superpone. */}
          <text x="0" y={ALTO - 3} fontSize="9" fill={TENUE}>
            {etiquetaPeriodo(datos[0].periodo, unidad)}
          </text>
          <text x={ANCHO} y={ALTO - 3} fontSize="9" fill={TENUE} textAnchor="end">
            {etiquetaPeriodo(datos[datos.length - 1].periodo, unidad)}
          </text>
        </svg>
      )}

      {/* El SVG es la lectura rapida; el numero exacto de cada periodo vive aca.
          <details> nativo: no necesita estado ni cliente. */}
      <details className="mt-3">
        <summary
          className="flex min-h-[44px] cursor-pointer items-center text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: TENUE, outlineColor: VERDE }}
        >
          Ver los números
        </summary>
        <div className="max-h-[220px] overflow-y-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{titulo} por período</caption>
            <thead>
              <tr style={{ color: TENUE }}>
                <th scope="col" className="py-1 text-left font-semibold">
                  Período
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  {titulo}
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.periodo} style={{ borderTop: `1px solid ${LINEA}` }}>
                  <th scope="row" className="py-1.5 text-left font-normal" style={{ color: TINTA }}>
                    {etiquetaPeriodo(d.periodo, unidad)}
                  </th>
                  <td className="py-1.5 text-right" style={{ color: TINTA }}>
                    {fmt(d[campo])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/**
 * Los tres colores salen del validador de la skill dataviz (verde de marca +
 * azul + violeta): pasan separacion para daltonismo y contraste 3:1 sobre
 * blanco. No cambiarlos de a uno sin volver a validar el trio.
 *
 * Cada grafico es su propio espacio de identidad, asi que los mismos tres se
 * reusan en tipos y en duraciones sin que se confundan entre si.
 */
const COLORES = ["#057305", "#2a78d6", "#4a3aa7"] as const;

/** Promociones del rango abiertas por origen. */
export function GraficoTipos({ tipos }: { tipos: Estadisticas["tipos"] }) {
  return (
    <GraficoDesglose
      titulo="Promociones por tipo"
      vacio="Nadie promocionó una publicación en este período."
      filas={[
        { texto: "Premium (crédito de suscripción)", valor: tipos.premium },
        { texto: "Individual (pago suelto)", valor: tipos.individual },
        { texto: "Cortesía (gratis)", valor: tipos.cortesia },
      ]}
    />
  );
}

/**
 * Las mismas promociones abiertas por plan. Son dos graficos y no uno cruzado
 * de seis barras: origen x duracion se lee peor y no responde ninguna de las
 * dos preguntas de corrido.
 */
export function GraficoDuraciones({
  duraciones,
}: {
  duraciones: Estadisticas["duraciones"];
}) {
  return (
    <GraficoDesglose
      titulo="Promociones por duración"
      vacio="Nadie promocionó una publicación en este período."
      filas={[
        { texto: "15 días", valor: duraciones.d15 },
        { texto: "30 días", valor: duraciones.d30 },
        // Premium y cortesia no pasan por los planes, asi que su plazo puede
        // ser cualquiera. Sin esta fila las barras no sumarian el total.
        { texto: "Otra duración", valor: duraciones.otras },
      ]}
    />
  );
}

/**
 * Desglose categorico: barras horizontales, que es lo unico que deja leer las
 * etiquetas completas en un celular. Maximo tres filas, que es hasta donde
 * llega el trio de colores validado.
 */
function GraficoDesglose({
  titulo,
  vacio,
  filas,
}: {
  titulo: string;
  vacio: string;
  filas: { texto: string; valor: number }[];
}) {
  const total = filas.reduce((a, f) => a + f.valor, 0);
  const max = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <figure
      className="m-0 rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: `1px solid ${LINEA}` }}
    >
      <figcaption>
        <h3 className="text-[13px]" style={{ color: TENUE }}>
          {titulo}
        </h3>
        <p className="mt-0.5 text-[22px]" style={{ color: VERDE, fontWeight: 800 }}>
          {numero(total)}
        </p>
      </figcaption>

      {total === 0 ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        // Cada fila lleva su nombre y su numero escritos: la identidad nunca
        // depende del color solo.
        <dl className="mt-3 space-y-3">
          {filas.map(({ texto, valor }, i) => (
            <div key={texto}>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px]" style={{ color: TINTA }}>
                  {texto}
                </dt>
                <dd
                  className="shrink-0 text-[13px] tabular-nums"
                  style={{ color: TINTA, fontWeight: 600 }}
                >
                  {numero(valor)}
                  <span style={{ color: TENUE, fontWeight: 400 }}>
                    {" "}
                    ({Math.round((valor / total) * 100)}%)
                  </span>
                </dd>
              </div>
              <span
                aria-hidden
                className="mt-1 block h-2 w-full overflow-hidden rounded-full"
                style={{ background: "#F2F1ED" }}
              >
                <span
                  className="block h-2 rounded-full"
                  style={{ width: `${(valor / max) * 100}%`, background: COLORES[i] }}
                />
              </span>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}
