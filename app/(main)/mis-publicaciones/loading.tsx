export default function Loading() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <div className="h-8 w-56 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[86px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />
        ))}
      </div>
      <span className="sr-only" role="status">
        Cargando tus publicaciones
      </span>
    </div>
  );
}
