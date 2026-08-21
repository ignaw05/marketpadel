import { Crown } from "lucide-react";
import { Metric } from "@/components/metric";
import { Ranking, GraficoSerie, GraficoDesglose } from "@/components/admin/grafico";
import { SelectorRango } from "@/components/admin/selector-rango";
import {
  panelDinero,
  panelResumen,
  rangoActual,
  type PagoAdmin,
} from "@/lib/admin-db";
import { formatPrecio } from "@/lib/paletas";

const numero = (n: number) => n.toLocaleString("es-AR");
const FECHA = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

const ESTADO = {
  aprobado: { texto: "Aprobado", fondo: "rgba(5,115,5,0.1)", color: "#057305" },
  pendiente: { texto: "Pendiente", fondo: "#F2F1ED", color: "#5B6470" },
  rechazado: { texto: "Rechazado", fondo: "rgba(212,24,61,0.08)", color: "#D4183D" },
  devuelto: { texto: "Devuelto", fondo: "rgba(212,24,61,0.08)", color: "#D4183D" },
} as const;

const CONCEPTO = {
  promocion: "Promoción",
  suscripcion: "Suscripción Pro",
  donacion: "Donación",
} as const;

function FilaPago({ p, primera }: { p: PagoAdmin; primera: boolean }) {
  const badge = ESTADO[p.estado];
  return (
    <li
      className="flex items-center gap-3 p-3 px-4"
      style={primera ? undefined : { borderTop: "1px solid #E6E4DF" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {CONCEPTO[p.concepto]}
        </p>
        <p className="truncate text-[12px]" style={{ color: "#5B6470" }}>
          {p.persona} · {FECHA.format(new Date(p.created_at))}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className="text-[15px] tabular-nums"
          style={{ color: "#14171A", fontWeight: 700 }}
        >
          {formatPrecio(p.monto)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[12px]"
          style={{ background: badge.fondo, color: badge.color, fontWeight: 600 }}
        >
          {badge.texto}
        </span>
      </div>
    </li>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const rango = rangoActual((await searchParams).rango);
  // Dos RPC porque la serie de ingresos vive en el resumen: repetirla en
  // panel_dinero seria calcular los mismos 12 buckets dos veces.
  const [d, r] = await Promise.all([panelDinero(rango), panelResumen(rango)]);

  const hayPagos = d.pagos.total > 0;
  const sinSuscripciones = d.suscripciones.vigentes === 0 && d.suscripciones.pro_vigentes === 0;

  return (
    <div className="space-y-6">
      <SelectorRango actual={rango} base="/admin/dinero" />

      {/* El bruto en verde lleno: es el unico numero de esta pantalla que se
          mira primero, y compite con seis tarjetas iguales si no se distingue. */}
      <div className="rounded-[14px] p-5" style={{ background: "#057305" }}>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.82)" }}>
          Bruto del período
        </p>
        <p
          className="mt-1 text-[34px]"
          style={{ color: "#c8ff28", fontWeight: 800, letterSpacing: "-0.025em" }}
        >
          {formatPrecio(d.bruto.periodo)}
        </p>
        <p className="mt-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.82)" }}>
          {d.comparable && d.bruto.anterior !== null && (
            <>
              <span style={{ color: "#c8ff28", fontWeight: 600 }}>
                {d.bruto.periodo >= d.bruto.anterior ? "+" : "−"}
                {formatPrecio(Math.abs(d.bruto.periodo - d.bruto.anterior))}
              </span>{" "}
              vs. período anterior ·{" "}
            </>
          )}
          {formatPrecio(d.bruto.historico)} desde siempre
        </p>
        <p className="mt-2.5 text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>
          Bruto de los pagos aprobados, sin descontar la comisión de MercadoPago.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Ticket promedio"
          value={d.ticket !== null ? formatPrecio(d.ticket) : "—"}
          detalle={
            d.ticket !== null
              ? `Sobre ${numero(d.pagos.aprobados)} ${d.pagos.aprobados === 1 ? "pago aprobado" : "pagos aprobados"}`
              : "Sin pagos aprobados en el período"
          }
        />
        <Metric
          label="Tasa de aprobación"
          value={d.tasa_aprobacion !== null ? `${d.tasa_aprobacion}%` : "—"}
          detalle={
            d.tasa_aprobacion !== null
              ? `${numero(d.pagos.aprobados)} de ${numero(d.pagos.total)} intentos`
              : "Nadie intentó pagar en el período"
          }
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <GraficoDesglose
          titulo="Ingresos por concepto"
          vacio="No entró plata en este período."
          moneda
          filas={[
            { texto: "Promociones", valor: d.por_concepto.promocion },
            { texto: "Suscripciones Pro", valor: d.por_concepto.suscripcion },
            { texto: "Donaciones", valor: d.por_concepto.donacion },
          ]}
        />
        <Ranking
          titulo="Intentos de pago por estado"
          total={numero(d.pagos.total)}
          vacio="Nadie intentó pagar en este período."
          nota="Cantidad de intentos, no monto: es lo que le da contexto a la tasa de aprobación."
          filas={[
            { texto: "Aprobado", valor: d.por_estado.aprobado },
            { texto: "Pendiente", valor: d.por_estado.pendiente },
            { texto: "Rechazado", valor: d.por_estado.rechazado },
            { texto: "Devuelto", valor: d.por_estado.devuelto },
          ]}
        />
        <GraficoSerie
          titulo="Ingresos en el tiempo"
          datos={r.serie}
          unidad={r.unidad}
          campo="ingresos"
          moneda
        />
        <GraficoDesglose
          titulo="Promociones por tipo"
          vacio="Nadie promocionó una publicación en este período."
          filas={[
            { texto: "Premium (crédito de suscripción)", valor: d.tipos.premium },
            { texto: "Individual (pago suelto)", valor: d.tipos.individual },
            { texto: "Cortesía (gratis)", valor: d.tipos.cortesia },
          ]}
        />
        <GraficoDesglose
          titulo="Promociones por duración"
          vacio="Nadie promocionó una publicación en este período."
          nota="Premium y cortesía no pasan por los planes, así que su plazo puede ser cualquiera."
          filas={[
            { texto: "15 días", valor: d.duraciones.d15 },
            { texto: "30 días", valor: d.duraciones.d30 },
            { texto: "Otra duración", valor: d.duraciones.otras },
          ]}
        />

        {/* Vendedor Pro: hoy es todo cero, asi que el estado vacio es LA
            pantalla y no un caso raro. */}
        <div
          className="rounded-[14px] p-4"
          style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
        >
          <h3 className="text-[13px]" style={{ color: "#5B6470" }}>
            Vendedor Pro
          </h3>
          {sinSuscripciones ? (
            <div className="flex flex-col items-center justify-center px-2 py-7 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#F2F1ED", color: "#057305" }}
              >
                <Crown size={22} aria-hidden />
              </span>
              <p className="mt-3 text-[15px]" style={{ color: "#14171A", fontWeight: 600 }}>
                Todavía nadie se suscribió
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "#5B6470" }}>
                Cuando haya suscripciones Pro vas a ver acá las vigentes y
                cuántos créditos de promoción se consumen por período.
              </p>
            </div>
          ) : (
            <dl className="mt-3 space-y-2.5 text-[14px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt style={{ color: "#5B6470" }}>Suscripciones vigentes</dt>
                <dd className="tabular-nums" style={{ color: "#14171A", fontWeight: 600 }}>
                  {numero(d.suscripciones.vigentes)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt style={{ color: "#5B6470" }}>Perfiles Pro</dt>
                <dd className="tabular-nums" style={{ color: "#14171A", fontWeight: 600 }}>
                  {numero(d.suscripciones.pro_vigentes)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt style={{ color: "#5B6470" }}>Créditos usados</dt>
                <dd className="tabular-nums" style={{ color: "#14171A", fontWeight: 600 }}>
                  {numero(d.suscripciones.creditos_usados)} de{" "}
                  {numero(d.suscripciones.creditos_totales)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <section aria-labelledby="ultimos">
        <h2
          id="ultimos"
          className="mb-2.5 text-[16px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Últimos pagos
        </h2>
        {d.ultimos.length === 0 ? (
          <div
            className="rounded-[14px] py-14 text-center"
            style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
          >
            <p className="text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
              Todavía no hubo ningún pago
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
              Cuando alguien promocione o done, el movimiento aparece acá.
            </p>
          </div>
        ) : (
          <ul
            className="overflow-hidden rounded-[14px]"
            style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {/* Los 15 ultimos de siempre, no del rango: es el registro de "que
                paso", y filtrarlo por ventana lo dejaria vacio justo cuando
                mas se lo consulta. */}
            {d.ultimos.map((p, i) => (
              <FilaPago key={p.id} p={p} primera={i === 0} />
            ))}
          </ul>
        )}
      </section>

      {!hayPagos && (
        <p className="text-[13px]" style={{ color: "#5B6470" }}>
          En este período no hubo movimientos. Probá con un rango más amplio.
        </p>
      )}
    </div>
  );
}
