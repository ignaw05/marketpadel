import { MapPin, Diamond, Droplet, Circle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Paleta, Forma, formatPrecio } from "../data";

function FormaIcon({ forma, size = 13 }: { forma: Forma; size?: number }) {
  if (forma === "Diamante") return <Diamond size={size} />;
  if (forma === "Lágrima") return <Droplet size={size} />;
  return <Circle size={size} />;
}

export function PaletaCard({
  paleta,
  onClick,
}: {
  paleta: Paleta;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-[14px] text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "";
      }}
    >
      <div className="relative h-52 shrink-0 sm:h-56" style={{ background: "#F2F1ED" }}>
        <ImageWithFallback
          src={paleta.imagen}
          alt={`${paleta.marca} ${paleta.modelo}`}
          className="h-full w-full object-cover"
        />
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
            style={{ background: "#F2F1ED", color: "#6B7280", fontWeight: 600 }}
          >
            {paleta.anio}
          </span>
        </div>
        <p className="mt-2 text-[19px]" style={{ color: "#0F5132", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[13px]" style={{ color: "#6B7280" }}>
          <MapPin size={13} /> {paleta.ubicacion}
        </p>
      </div>
    </button>
  );
}
