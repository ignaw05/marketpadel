import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { Variacion } from "@/lib/panel";

/**
 * El signo NUNCA se comunica solo con color: van flecha, numero y la frase de
 * contra que se compara. Verde para todo, tambien para las bajas -- pintar de
 * rojo una caida asume que subir siempre es bueno, y "publicaciones dadas de
 * baja" no funciona asi.
 */
const ICONO = { sube: ArrowUp, baja: ArrowDown, igual: Minus } as const;
const PREFIJO = { sube: "Subió", baja: "Bajó", igual: "Sin cambios" } as const;

function Delta({ variacion, texto, nota }: { variacion: Variacion; texto: string; nota: string }) {
  const Icono = ICONO[variacion.signo];
  return (
    <p
      className="mt-1 flex flex-wrap items-center gap-1 text-[12px]"
      style={{ color: "#057305", fontWeight: 600 }}
    >
      <Icono size={12} aria-hidden />
      <span className="sr-only">{PREFIJO[variacion.signo]} </span>
      {variacion.signo === "igual" ? "Sin cambios" : texto}
      <span style={{ color: "#5B6470", fontWeight: 400 }}>{nota}</span>
    </p>
  );
}

/** Tarjeta de numero suelto. La usan Mis publicaciones y el panel. */
export function Metric({
  label,
  value,
  detalle,
  variacion,
  deltaTexto,
  deltaNota = "vs. período anterior",
}: {
  label: string;
  value: string;
  /** Segunda linea chica, para el contexto que el numero solo no da. */
  detalle?: string;
  /**
   * Cuanto se movio contra la ventana anterior. null (rango 'total', o metrica
   * sin comparacion) no dibuja nada: mejor sin flecha que con una flecha que
   * miente.
   */
  variacion?: Variacion | null;
  /** El delta ya formateado, que la tarjeta no sabe si son pesos o unidades. */
  deltaTexto?: string;
  deltaNota?: string;
}) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <p className="text-[13px]" style={{ color: "#5B6470" }}>
        {label}
      </p>
      <p className="mt-1 text-[24px]" style={{ color: "#057305", fontWeight: 800, letterSpacing: "-0.025em" }}>
        {value}
      </p>
      {variacion && deltaTexto ? (
        <Delta variacion={variacion} texto={deltaTexto} nota={deltaNota} />
      ) : (
        detalle && (
          <p className="mt-0.5 text-[12px]" style={{ color: "#5B6470" }}>
            {detalle}
          </p>
        )
      )}
    </div>
  );
}
