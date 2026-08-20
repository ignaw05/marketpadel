import Link from "next/link";
import { BadgeCheck, AlertCircle } from "lucide-react";
import { BotonRenovarPro } from "./boton-pro";
import { type MiPlan } from "@/lib/pro-db";
import { PLAN_PRO, avisoPro, creditosRestantes, esPro } from "@/lib/pro";
import { formatPrecio } from "@/lib/paletas";

const FECHA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });

const tarjeta: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E6E4DF",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

// La vuelta de MercadoPago no confirma nada: quien activa el plan es el webhook,
// y el usuario puede llegar antes. Por eso "exito" no promete que ya esté activo.
const AVISO_PAGO = {
  exito: {
    texto:
      "Pago aprobado. El plan se activa en unos segundos; si todavía no lo ves, recargá.",
    fondo: "rgba(5,115,5,0.08)",
    color: "#057305",
    alerta: false,
  },
  pendiente: {
    texto: "Tu pago quedó pendiente. Apenas MercadoPago lo apruebe, el plan se activa solo.",
    fondo: "#F2F1ED",
    color: "#14171A",
    alerta: false,
  },
  error: {
    texto: "El pago no se completó. No te cobramos nada, podés intentar de nuevo.",
    fondo: "rgba(212,24,61,0.08)",
    color: "#D4183D",
    alerta: true,
  },
} as const;

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[14px]" style={{ color: "#5B6470" }}>
        {label}
      </dt>
      <dd className="text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
        {children}
      </dd>
    </div>
  );
}

export function PlanPro({ plan, pago }: { plan: MiPlan; pago?: string }) {
  const activo = esPro(plan.hasta);
  const aviso = avisoPro(plan.hasta);
  // Tres estados, no dos: al que dejó vencer el plan recién hay que decirle qué
  // perdió, no venderle de cero. Pasada la ventana de aviso vuelve a ser alguien
  // a quien se le ofrece el plan.
  const vencido = aviso === "vencido";
  const quedan = creditosRestantes(plan.usados);
  const avisoPagoMP = AVISO_PAGO[pago as keyof typeof AVISO_PAGO];

  return (
    <section className="rounded-[14px] p-4 md:p-5" style={tarjeta}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[16px]" style={{ color: "#14171A", fontWeight: 700 }}>
          Vendedor Pro
        </h2>
        {(activo || vencido) && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            style={
              aviso
                ? { background: "rgba(212,24,61,0.08)", color: "#D4183D", fontWeight: 700 }
                : { background: "rgba(5,115,5,0.10)", color: "#057305", fontWeight: 700 }
            }
          >
            {aviso ? <AlertCircle size={11} aria-hidden /> : <BadgeCheck size={11} aria-hidden />}
            {vencido ? "Vencido" : aviso ? "Vence pronto" : "Activo"}
          </span>
        )}
      </div>

      {avisoPagoMP && (
        <p
          role={avisoPagoMP.alerta ? "alert" : "status"}
          className="mb-4 flex items-start gap-2 rounded-[10px] p-3 text-[14px]"
          style={{ background: avisoPagoMP.fondo, color: avisoPagoMP.color, lineHeight: 1.5 }}
        >
          {avisoPagoMP.alerta ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          ) : (
            <BadgeCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
          )}
          {avisoPagoMP.texto}
        </p>
      )}

      {vencido ? (
        <>
          <div role="alert" className="rounded-[10px] p-3" style={{ background: "rgba(212,24,61,0.06)" }}>
            <p className="text-[14px]" style={{ color: "#D4183D", fontWeight: 600 }}>
              Se venció el{" "}
              <time dateTime={plan.hasta!}>{FECHA.format(new Date(plan.hasta!))}</time>.
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "#5B6470", lineHeight: 1.45 }}>
              El distintivo ya no aparece en tus paletas y saliste de Vendedores Pro. Tus
              publicaciones siguen ahí, intactas.
            </p>
          </div>
          <div className="mt-4">
            <BotonRenovarPro />
          </div>
        </>
      ) : !activo ? (
        <>
          <p className="text-[14px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
            El distintivo con tu nombre en todas tus paletas, {PLAN_PRO.creditos} promociones de{" "}
            {PLAN_PRO.diasPromo} días por mes y tu propia cartelera.{" "}
            {formatPrecio(PLAN_PRO.precio)} por mes.
          </p>
          <div className="mt-4">
            <Link
              href="/pro"
              className="flex min-h-[44px] w-full items-center justify-center rounded-[14px] py-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                background: "#057305",
                color: "#FFFFFF",
                fontWeight: 600,
                outlineColor: "#057305",
              }}
            >
              Conocer Vendedor Pro
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* El aviso dentro de la app: reemplaza al mail de vencimiento. */}
          {aviso && (
            <div
              role="alert"
              className="mb-4 rounded-[10px] p-3"
              style={{ background: "rgba(212,24,61,0.06)" }}
            >
              <p className="text-[14px]" style={{ color: "#D4183D", fontWeight: 600 }}>
                Vence en pocos días.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "#5B6470", lineHeight: 1.45 }}>
                Si no lo renovás, el distintivo desaparece de tus paletas y salís de Vendedores
                Pro. Las promociones que ya usaste siguen corriendo hasta cumplir sus{" "}
                {PLAN_PRO.diasPromo} días.
              </p>
            </div>
          )}

          <dl className="flex flex-col gap-2.5">
            <Dato label="Vence el">
              <time dateTime={plan.hasta!}>{FECHA.format(new Date(plan.hasta!))}</time>
            </Dato>
            <Dato label="Promociones">
              {quedan} de {PLAN_PRO.creditos} disponibles
            </Dato>
          </dl>

          <p className="mt-3 text-[13px]" style={{ color: "#5B6470", lineHeight: 1.45 }}>
            Vuelven a {PLAN_PRO.creditos} al pagar el mes siguiente. Las que no uses no se acumulan.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {aviso ? (
              <BotonRenovarPro />
            ) : (
              <Link
                href="/mis-publicaciones"
                className="flex min-h-[44px] w-full items-center justify-center rounded-[14px] py-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6E4DF",
                  color: "#14171A",
                  fontWeight: 600,
                  outlineColor: "#057305",
                }}
              >
                {quedan > 0 ? "Usar una promoción" : "Ver mis publicaciones"}
              </Link>
            )}
            <Link
              href="/vendedores"
              className="self-center p-2 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "#057305", fontWeight: 600, outlineColor: "#057305" }}
            >
              Ver mi cartelera
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
