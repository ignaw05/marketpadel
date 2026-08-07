export default function Loading() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-[14px]"
            style={{ background: "#F2F1ED" }}
          />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-[14px]"
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
