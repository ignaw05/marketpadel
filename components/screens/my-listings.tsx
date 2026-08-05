import Link from "next/link";
import { PackageOpen, Plus, Eye, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "../image-with-fallback";
import { AccionesPaleta } from "../acciones-paleta";
import { Paleta, formatPrecio, foto } from "@/lib/paletas";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <p className="text-[13px]" style={{ color: "#5B6470" }}>
        {label}
      </p>
      <p className="mt-1 text-[24px]" style={{ color: "#0F5132", fontWeight: 800 }}>
        {value}
      </p>
    </div>
  );
}

const BADGE = {
  activa: { texto: "Activa", fondo: "rgba(15,81,50,0.1)", color: "#0F5132" },
  pausada: { texto: "Pausada", fondo: "#F2F1ED", color: "#5B6470" },
  vendida: { texto: "Vendida", fondo: "rgba(20,23,26,0.08)", color: "#14171A" },
  eliminada: { texto: "Eliminada", fondo: "#F2F1ED", color: "#5B6470" },
} as const;

function Row({ paleta }: { paleta: Paleta }) {
  const badge = BADGE[paleta.estado_publicacion ?? "activa"];

  return (
    <div
      className="flex items-center gap-3 rounded-[14px] p-3"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px]"
        style={{ background: "#F2F1ED" }}
      >
        <ImageWithFallback
          src={foto(paleta)}
          alt={`${paleta.marca} ${paleta.modelo}`}
          sizes="64px"
          className="object-contain p-1"
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/paletas/${paleta.id}`}
          className="block truncate text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#14171A", fontWeight: 600, outlineColor: "#0F5132" }}
        >
          {paleta.marca} {paleta.modelo}
        </Link>
        <p className="text-[15px]" style={{ color: "#0F5132", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[12px]" style={{ color: "#5B6470" }}>
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: badge.fondo, color: badge.color, fontWeight: 600 }}
          >
            {badge.texto}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} aria-hidden /> {paleta.visitas.toLocaleString("es-AR")}
            <span className="sr-only">visitas</span>
          </span>
        </div>
      </div>

      <AccionesPaleta paleta={paleta} />
    </div>
  );
}

export function MyListings({
  paletas,
  publicada,
}: {
  paletas: Paleta[];
  publicada?: boolean;
}) {
  const activas = paletas.filter((p) => p.estado_publicacion === "activa").length;
  const vendidas = paletas.filter((p) => p.estado_publicacion === "vendida").length;
  const visitas = paletas.reduce((s, p) => s + p.visitas, 0);

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Mis publicaciones</h1>

      {publicada && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-[14px] p-3 text-[14px]"
          style={{ background: "rgba(15,81,50,0.08)", color: "#0F5132" }}
        >
          <CheckCircle2 size={16} aria-hidden /> ¡Paleta publicada! Ya está visible para todos.
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Activas" value={String(activas)} />
        <Metric label="Vendidas" value={String(vendidas)} />
        <Metric label="Visitas totales" value={visitas.toLocaleString("es-AR")} />
      </div>

      <div className="mt-6 space-y-3">
        {paletas.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center"
            style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "#F2F1ED" }}
            >
              <PackageOpen size={28} style={{ color: "#0F5132" }} aria-hidden />
            </div>
            <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
              Todavía no publicaste nada
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
              Publicá tu primera paleta y llegá a jugadores de todo el país.
            </p>
            <Link
              href="/publicar"
              className="mt-5 flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
            >
              <Plus size={16} aria-hidden /> Publicar tu primera paleta
            </Link>
          </div>
        ) : (
          paletas.map((p) => <Row key={p.id} paleta={p} />)
        )}
      </div>
    </div>
  );
}
