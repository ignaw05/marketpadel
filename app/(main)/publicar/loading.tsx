export default function Loading() {
  return (
    <div className="mx-auto max-w-[640px] px-4 pt-6 md:px-6">
      <div className="h-8 w-52 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
      <div
        className="mt-5 h-[560px] animate-pulse rounded-[14px]"
        style={{ background: "#F2F1ED" }}
      />
      <span className="sr-only" role="status">
        Cargando el formulario
      </span>
    </div>
  );
}
