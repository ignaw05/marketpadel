import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { Paleta, formatPrecio, estadoLabel } from "@/lib/paletas";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: "#F2F1ED" }}>
      <p className="text-[12px]" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="mt-0.5 text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
        {value}
      </p>
    </div>
  );
}

export function DetailView({ paleta }: { paleta: Paleta }) {
  return (
    <div className="mx-auto max-w-[720px] pb-10">
      <div className="px-4 py-3 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px]"
          style={{ color: "#14171A", fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>

      <div className="relative" style={{ background: "#F2F1ED", aspectRatio: "4 / 3" }}>
        <ImageWithFallback
          src={paleta.imagen}
          alt={`${paleta.marca} ${paleta.modelo}`}
          className="h-full w-full object-contain p-6"
        />
      </div>

      <div className="p-5">
        <p className="text-[13px]" style={{ color: "#6B7280" }}>
          {paleta.marca}
        </p>
        <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 22 }}>
          {paleta.modelo}
        </h1>
        <p className="mt-1 text-[26px]" style={{ color: "#0F5132", fontWeight: 800 }}>
          {formatPrecio(paleta.precio)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Spec label="Estado" value={`${paleta.estado}/10 · ${estadoLabel(paleta.estado)}`} />
          <Spec label="Forma" value={paleta.forma} />
          <Spec label="Año" value={String(paleta.anio)} />
          <Spec label="Ubicación" value={paleta.ubicacion} />
        </div>

        <p className="mt-4 text-[15px]" style={{ color: "#14171A", lineHeight: 1.6 }}>
          {paleta.descripcion}
        </p>

        <div
          className="mt-5 flex items-center gap-3 rounded-[14px] p-3"
          style={{ background: "#FAFAF8", border: "1px solid #E6E4DF" }}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-white"
            style={{ background: "#0F5132", fontWeight: 700 }}
          >
            {paleta.vendedor.nombre[0]}
            {paleta.vendedor.apellido[0]}
          </div>
          <div>
            <p className="text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
              {paleta.vendedor.nombre} {paleta.vendedor.apellido}
            </p>
            <p className="text-[12px]" style={{ color: "#6B7280" }}>
              Miembro desde {paleta.vendedor.miembroDesde}
            </p>
          </div>
          <p className="ml-auto flex items-center gap-1 text-[12px]" style={{ color: "#6B7280" }}>
            <MapPin size={12} /> {paleta.ubicacion}
          </p>
        </div>
      </div>

      {/* CTA WhatsApp */}
      <div className="px-5">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Hola! Me interesa tu ${paleta.marca} ${paleta.modelo} publicada en PaletaMarket.`,
          )}`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90"
          style={{ background: "#25D366", fontWeight: 700 }}
        >
          <MessageCircle size={19} /> Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
