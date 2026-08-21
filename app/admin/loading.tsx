/**
 * Un solo loading para todo /admin: Next lo usa en las subrutas que no traen
 * el suyo. Por eso el esqueleto es el denominador comun de las pantallas con
 * datos -- selector, tarjetas y bloques -- y no el calco de una sola.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-[44px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-[14px]"
            style={{ background: "#F2F1ED" }}
          />
        ))}
      </div>

      <div className="h-[180px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
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
