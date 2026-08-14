/** Tarjeta de numero suelto. La usan Mis publicaciones y el resumen del panel. */
export function Metric({
  label,
  value,
  detalle,
}: {
  label: string;
  value: string;
  /** Segunda linea chica, para el contexto que el numero solo no da. */
  detalle?: string;
}) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <p className="text-[13px]" style={{ color: "#5B6470" }}>
        {label}
      </p>
      <p className="mt-1 text-[24px]" style={{ color: "#057305", fontWeight: 800 }}>
        {value}
      </p>
      {detalle && (
        <p className="mt-0.5 text-[12px]" style={{ color: "#5B6470" }}>
          {detalle}
        </p>
      )}
    </div>
  );
}
