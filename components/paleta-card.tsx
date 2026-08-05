import Link from "next/link";
import { MapPin, Diamond, Droplet, Circle, Star } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { Paleta, Forma, formatPrecio, foto } from "@/lib/paletas";

function FormaIcon({ forma, size = 13 }: { forma: Forma; size?: number }) {
  if (forma === "Diamante") return <Diamond size={size} aria-hidden />;
  if (forma === "Lágrima") return <Droplet size={size} aria-hidden />;
  return <Circle size={size} aria-hidden />;
}

export function PaletaCard({ paleta, priority }: { paleta: Paleta; priority?: boolean }) {
  return (
    <Link
      href={`/paletas/${paleta.id}`}
      className="group flex flex-col overflow-hidden rounded-[14px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        outlineColor: "#0F5132",
      }}
    >
      {/* aspect-ratio en vez de alto fijo: la grilla queda pareja en cualquier
          ancho, y 4/5 es la proporcion de una foto vertical de celular. */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ background: "#F2F1ED", aspectRatio: "4 / 5" }}
      >
        <ImageWithFallback
          src={foto(paleta)}
          alt={`${paleta.marca} ${paleta.modelo}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {paleta.promocionada && (
          <span
            className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: "#0F5132", color: "#FFFFFF", fontWeight: 700 }}
          >
            <Star size={11} aria-hidden /> Destacada
          </span>
        )}
        <span
          className="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[12px]"
          style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
        >
          {paleta.estado}/10
        </span>
      </div>
      <div className="p-3.5">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {paleta.marca} {paleta.modelo}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "#F2F1ED", color: "#14171A", fontWeight: 600 }}
          >
            <FormaIcon forma={paleta.forma} size={11} /> {paleta.forma}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "#F2F1ED", color: "#5B6470", fontWeight: 600 }}
          >
            {paleta.anio}
          </span>
        </div>
        <p className="mt-2 text-[19px]" style={{ color: "#0F5132", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[13px]" style={{ color: "#5B6470" }}>
          <MapPin size={13} aria-hidden /> {paleta.ciudad}
        </p>
      </div>
    </Link>
  );
}
