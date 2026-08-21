import Link from "next/link";
import { MapPin, Diamond, Droplet, Circle, Star, BadgeCheck, RefreshCw } from "lucide-react";
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
        outlineColor: "#057305",
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
          mini
          priority={priority}
          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {paleta.promocionada && (
          <span
            className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: "#057305", color: "#FFFFFF", fontWeight: 700 }}
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
        {/* Superpuesta y no en el flujo: asi la card de un Pro mide exactamente
            lo mismo que las demas y la grilla no se descuadra. */}
        {paleta.vendedor_pro && (
          <p
            className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px]"
            style={{ background: "rgba(5,115,5,0.94)", color: "#FFFFFF", fontWeight: 700 }}
          >
            <BadgeCheck size={13} aria-hidden className="shrink-0" />
            <span className="truncate">{paleta.vendedor_pro}</span>
            <span className="sr-only">— Vendedor Pro</span>
          </p>
        )}
      </div>
      <div className="p-3.5">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {paleta.marca} {paleta.modelo}
        </p>
        {/* Envuelve en celular, una sola linea desde md: ahi el chip de permuta
            queda al lado del anio y la forma se achica en vez de desbordar. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:flex-nowrap">
          <span
            className="flex min-w-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "#F2F1ED", color: "#14171A", fontWeight: 600 }}
          >
            <span className="shrink-0">
              <FormaIcon forma={paleta.forma} size={11} />
            </span>
            <span className="truncate">{paleta.forma}</span>
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "#F2F1ED", color: "#5B6470", fontWeight: 600 }}
          >
            {paleta.anio}
          </span>
          {/* Solo cuando acepta, igual que en el detalle: no aceptar permuta es
              el caso normal y no merece un chip. */}
          {paleta.acepta_permuta && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
            >
              <RefreshCw size={11} aria-hidden /> Permuta
            </span>
          )}
        </div>
        <p className="mt-2 text-[19px]" style={{ color: "#057305", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[13px]" style={{ color: "#5B6470" }}>
          <MapPin size={13} aria-hidden /> {paleta.ciudad}, {paleta.provincia}
        </p>
      </div>
    </Link>
  );
}
