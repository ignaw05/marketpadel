export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] pb-10">
      <div className="px-4 py-3 md:px-6">
        <div className="h-[44px] w-24 animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />
      </div>
      <div className="w-full animate-pulse" style={{ background: "#F2F1ED", aspectRatio: "4 / 3" }} />
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
        <div className="h-6 w-2/3 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
        <div className="h-8 w-40 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[62px] animate-pulse rounded-[14px]" style={{ background: "#F2F1ED" }} />
          ))}
        </div>
      </div>
      <span className="sr-only" role="status">
        Cargando la paleta
      </span>
    </div>
  );
}
