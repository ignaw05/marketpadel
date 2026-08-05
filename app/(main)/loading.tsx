export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap gap-2 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[44px] w-28 animate-pulse rounded-full"
            style={{ background: "#F2F1ED" }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[14px]" style={{ border: "1px solid #E6E4DF" }}>
            <div className="h-52 animate-pulse sm:h-56" style={{ background: "#F2F1ED" }} />
            <div className="space-y-2 p-3.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
              <div className="h-5 w-1/2 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        Cargando paletas
      </span>
    </div>
  );
}
