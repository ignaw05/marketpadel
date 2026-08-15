/** Mismas alturas que el resumen real: tarjetas, selector de rango y graficos. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-[14px]"
            style={{ background: "#F2F1ED" }}
          />
        ))}
      </div>

      <div className="h-[44px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] animate-pulse rounded-[14px]"
            style={{ background: "#F2F1ED" }}
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Cargando el panel
      </span>
    </div>
  );
}
