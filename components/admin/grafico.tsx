// Graficos del panel. Server Components: SVG plano, sin estado y sin JS en el
// cliente.
//
// ponytail: sin libreria de graficos. Ninguna esta instalada y lo que hace
// falta son barras verticales y barras horizontales; recharts entero pesa mas
// que toda esta pantalla. El tooltip es un <title> nativo del SVG, que ademas
// lo leen los lectores de pantalla gratis, y el dato exacto siempre esta
// disponible en la tabla del <details>.
import type { PuntoSerie, Unidad } from "@/lib/admin-db";
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
const FMT: Record<Unidad, Intl.DateTimeFormat> = {
  day: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }),
  week: new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }),
  month: new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }),
  year: new Intl.DateTimeFormat("es-AR", { year: "numeric", timeZone: "UTC" }),
};

/** "2026-08-12" -> "12 ago". */
export function etiquetaPeriodo(periodo: string, unidad: Unidad) {
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
  unidad: Unidad;
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
 * reusan en tipos, duraciones y formas sin que se confundan entre si.
 *
 * El trio solo alcanza para TRES filas, y por eso los rankings (marcas,
 * provincias, precios) no lo usan: van en <Ranking>, a una sola tinta. En una
 * lista ordenada la identidad la dan la etiqueta y la posicion, no el color,
 * asi que pintar ocho barras de ocho colores agrega ruido y no informacion.
 */
const COLORES = ["#057305", "#2a78d6", "#4a3aa7"] as const;

/** El gris de las filas plegadas ("Otras marcas"): presente pero en segundo plano. */
const GRIS = "#B9C0C7";

/** Marco comun de las tarjetas de grafico: mismo borde, radio y sombra que <Metric>. */
function Tarjeta({
  titulo,
  total,
  nota,
  children,
}: {
  titulo: string;
  total: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      className="m-0 rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: `1px solid ${LINEA}` }}
    >
      <figcaption>
        <h3 className="text-[13px]" style={{ color: TENUE }}>
          {titulo}
        </h3>
        <p
          className="mt-0.5 text-[22px]"
          style={{ color: VERDE, fontWeight: 800, letterSpacing: "-0.025em" }}
        >
          {total}
        </p>
        {nota && (
          <p className="mt-0.5 text-[12px]" style={{ color: TENUE }}>
            {nota}
          </p>
        )}
      </figcaption>
      {children}
    </figure>
  );
}

/** Una fila de barra horizontal con su etiqueta y su numero escritos. */
function Fila({
  texto,
  valor,
  ancho,
  color,
  porcentaje,
  formato = numero,
}: {
  texto: string;
  valor: number;
  /** 0-100, relativo al maximo de la lista: es la barra, no el porcentaje. */
  ancho: number;
  color: string;
  /** Se escribe al lado del numero. null cuando no hay total contra que sacarlo. */
  porcentaje: number | null;
  formato?: (n: number) => string;
}) {
  // Una fila en 0 se sigue listando, pero apagada: que la categoria exista y
  // este vacia es informacion, y esconderla la haria parecer inexistente.
  const vacia = valor === 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[13px]" style={{ color: vacia ? TENUE : TINTA }}>
          {texto}
        </dt>
        <dd
          className="shrink-0 text-[13px] tabular-nums"
          style={{ color: vacia ? TENUE : TINTA, fontWeight: 600 }}
        >
          {formato(valor)}
          {porcentaje !== null && (
            <span style={{ color: TENUE, fontWeight: 400 }}> ({porcentaje}%)</span>
          )}
        </dd>
      </div>
      <span
        aria-hidden
        className="mt-1 block h-2 w-full overflow-hidden rounded-full"
        style={{ background: "#F2F1ED" }}
      >
        {!vacia && (
          <span
            className="block h-2 rounded-full"
            style={{ width: `${ancho}%`, background: color }}
          />
        )}
      </span>
    </div>
  );
}

/**
 * Ranking de N filas a una sola tinta. Lo usan marcas, provincias, estados de
 * pago y el histograma de precios.
 *
 * La ultima fila puede venir plegada ("Otras marcas"): se dibuja en gris para
 * que no compita con las que si son una categoria.
 */
export function Ranking({
  titulo,
  total,
  vacio,
  nota,
  filas,
  moneda = false,
}: {
  titulo: string;
  /** El encabezado grande. Se pasa ya formateado: no siempre es la suma. */
  total: string;
  vacio: string;
  nota?: string;
  filas: { texto: string; valor: number; plegada?: boolean }[];
  moneda?: boolean;
}) {
  const suma = filas.reduce((a, f) => a + f.valor, 0);
  // El ancho es relativo al maximo y el porcentaje al total: la barra compara
  // filas entre si, el numero dice cuanto pesa sobre el conjunto.
  const max = Math.max(...filas.map((f) => f.valor), 0);
  const fmt = moneda ? formatPrecio : numero;

  return (
    <Tarjeta titulo={titulo} total={total} nota={nota}>
      {suma === 0 ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        <dl className="mt-3 space-y-3">
          {filas.map((f) => (
            <Fila
              key={f.texto}
              texto={f.texto}
              valor={f.valor}
              ancho={max > 0 ? (f.valor / max) * 100 : 0}
              color={f.plegada ? GRIS : VERDE}
              porcentaje={suma > 0 ? Math.round((f.valor / suma) * 100) : null}
              formato={fmt}
            />
          ))}
        </dl>
      )}
    </Tarjeta>
  );
}

/**
 * Histograma de barras verticales sobre categorias ORDENADAS (el estado 1 a 10).
 * Es un grafico aparte de <Ranking> porque el orden es el del eje, no el del
 * valor: reordenarlo por cantidad destruiria lo que el grafico dice.
 */
export function Histograma({
  titulo,
  total,
  nota,
  vacio,
  barras,
}: {
  titulo: string;
  total: string;
  nota?: string;
  vacio: string;
  barras: { etiqueta: string; valor: number }[];
}) {
  const suma = barras.reduce((a, b) => a + b.valor, 0);
  const max = Math.max(...barras.map((b) => b.valor), 0);
  const paso = ANCHO / barras.length;
  const ancho = Math.max(paso - 4, 1);

  return (
    <Tarjeta titulo={titulo} total={total} nota={nota}>
      {suma === 0 ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        <svg
          viewBox={`0 0 ${ANCHO} 124`}
          className="mt-3 block h-auto w-full"
          role="img"
          aria-label={`${titulo}. ${barras.map((b) => `${b.etiqueta}: ${numero(b.valor)}`).join(". ")}.`}
        >
          <line x1="0" y1={PISO} x2={ANCHO} y2={PISO} stroke={LINEA} strokeWidth="1" />
          {barras.map((b, i) => {
            const alto = max > 0 ? (b.valor / max) * (PISO - TECHO) : 0;
            const x = i * paso + 2;
            return (
              <g key={b.etiqueta}>
                {alto > 0 && <path d={barra(x, ancho, alto)} fill={VERDE} />}
                {/* El numero de cada barra, que aca si entra: son pocas categorias. */}
                <text
                  x={x + ancho / 2}
                  y={PISO - alto - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={b.valor === 0 ? TENUE : TINTA}
                  fontWeight={b.valor === 0 ? "400" : "600"}
                >
                  {numero(b.valor)}
                </text>
                <text
                  x={x + ancho / 2}
                  y={ALTO + 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill={TENUE}
                >
                  {b.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Tarjeta>
  );
}

/**
 * Desglose categorico de HASTA TRES filas, cada una con su color del trio
 * validado. Para mas de tres va <Ranking>, que es monocromo.
 *
 * Barras horizontales porque es lo unico que deja leer las etiquetas completas
 * en un celular.
 */
export function GraficoDesglose({
  titulo,
  vacio,
  filas,
  nota,
  moneda = false,
}: {
  titulo: string;
  vacio: string;
  filas: { texto: string; valor: number }[];
  nota?: string;
  /** Formatea los valores como pesos en vez de como cantidad. */
  moneda?: boolean;
}) {
  const total = filas.reduce((a, f) => a + f.valor, 0);
  const max = Math.max(...filas.map((f) => f.valor), 0);
  const fmt = moneda ? formatPrecio : numero;

  return (
    <Tarjeta titulo={titulo} total={fmt(total)} nota={nota}>
      {total === 0 ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        // Cada fila lleva su nombre y su numero escritos: la identidad nunca
        // depende del color solo.
        <dl className="mt-3 space-y-3">
          {filas.map(({ texto, valor }, i) => (
            <Fila
              key={texto}
              texto={texto}
              valor={valor}
              ancho={max > 0 ? (valor / max) * 100 : 0}
              color={COLORES[i]}
              porcentaje={Math.round((valor / total) * 100)}
              formato={fmt}
            />
          ))}
        </dl>
      )}
    </Tarjeta>
  );
}
