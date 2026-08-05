import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Eye } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { Paleta, Vendedor, formatPrecio, estadoLabel } from "@/lib/paletas";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: "#F2F1ED" }}>
      <p className="text-[12px]" style={{ color: "#5B6470" }}>
        {label}
      </p>
      <p className="mt-0.5 text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
        {value}
      </p>
    </div>
  );
}

export function DetailView({
  paleta,
  vendedor,
}: {
  paleta: Paleta;
  vendedor: Vendedor;
}) {
  const titulo = `${paleta.marca} ${paleta.modelo}`;
  const fotos = paleta.fotos.length ? paleta.fotos : [""];

  const texto = encodeURIComponent(
    `Hola! Me interesa tu ${titulo} publicada en PaletaMarket.`,
  );
  const tel = vendedor.whatsapp?.replace(/\D/g, "");
  const wa = tel ? `https://wa.me/${tel}?text=${texto}` : `https://wa.me/?text=${texto}`;

  return (
    <div className="mx-auto max-w-[720px] pb-10">
      <div className="px-4 py-3 md:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-3 py-2 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#14171A", fontWeight: 600, outlineColor: "#0F5132" }}
        >
          <ArrowLeft size={18} aria-hidden /> Volver
        </Link>
      </div>

      {/* ponytail: galeria con scroll-snap de CSS, sin libreria de carousel */}
      <div className="flex snap-x snap-mandatory overflow-x-auto">
        {fotos.map((f, i) => (
          <div
            key={i}
            className="relative w-full shrink-0 snap-center"
            style={{ background: "#F2F1ED", aspectRatio: "4 / 3" }}
          >
            <ImageWithFallback
              src={f}
              alt={fotos.length > 1 ? `${titulo}, foto ${i + 1} de ${fotos.length}` : titulo}
              sizes="(max-width: 720px) 100vw, 720px"
              priority={i === 0}
              className="object-contain p-6"
            />
          </div>
        ))}
      </div>

      <div className="p-5">
        <p className="text-[13px]" style={{ color: "#5B6470" }}>
          {paleta.marca}
        </p>
        <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 22 }}>{paleta.modelo}</h1>
        <p className="mt-1 text-[26px]" style={{ color: "#0F5132", fontWeight: 800 }}>
          {formatPrecio(paleta.precio)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Spec label="Estado" value={`${paleta.estado}/10 · ${estadoLabel(paleta.estado)}`} />
          <Spec label="Forma" value={paleta.forma} />
          <Spec label="Año" value={String(paleta.anio)} />
          <Spec label="Ubicación" value={`${paleta.ciudad}, ${paleta.provincia}`} />
        </div>

        <p className="mt-4 text-[15px]" style={{ color: "#14171A", lineHeight: 1.6 }}>
          {paleta.descripcion}
        </p>

        <div
          className="mt-5 flex items-center gap-3 rounded-[14px] p-3"
          style={{ background: "#FAFAF8", border: "1px solid #E6E4DF" }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "#0F5132", fontWeight: 700 }}
            aria-hidden
          >
            {vendedor.nombre[0]}
            {vendedor.apellido[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
              {vendedor.nombre} {vendedor.apellido}
            </p>
            <p className="text-[12px]" style={{ color: "#5B6470" }}>
              Miembro desde {vendedor.miembroDesde}
            </p>
          </div>
          <p
            className="ml-auto flex shrink-0 items-center gap-1 text-[12px]"
            style={{ color: "#5B6470" }}
          >
            <MapPin size={12} aria-hidden /> {paleta.ciudad}
          </p>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[13px]" style={{ color: "#5B6470" }}>
          <Eye size={14} aria-hidden /> {paleta.visitas.toLocaleString("es-AR")}{" "}
          {paleta.visitas === 1 ? "visita" : "visitas"}
        </p>
      </div>

      <div className="px-5">
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: "#128C4B", fontWeight: 700, outlineColor: "#0F5132" }}
        >
          <MessageCircle size={19} aria-hidden /> Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
