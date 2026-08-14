import Link from "next/link";
import { MapPin, MessageCircle, Eye, Star } from "lucide-react";
import { Galeria } from "./galeria";
import { PromocionarDialog } from "./promocionar-dialog";
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
  esDueno,
  logueado,
}: {
  paleta: Paleta;
  vendedor: Vendedor;
  esDueno?: boolean;
  logueado?: boolean;
}) {
  const titulo = `${paleta.marca} ${paleta.modelo}`;
  const fotos = paleta.fotos.length ? paleta.fotos : [""];

  const texto = encodeURIComponent(
    `Hola! Me interesa tu ${titulo} publicada en Paletita.`,
  );
  const tel = vendedor.whatsapp?.replace(/\D/g, "");
  const wa = tel ? `https://wa.me/${tel}?text=${texto}` : `https://wa.me/?text=${texto}`;

  return (
    <div className="mx-auto max-w-[720px] pb-10">
      {/* el "Volver al mercado" lo pone el header en toda pantalla que no sea el feed */}
      <Galeria fotos={fotos} titulo={titulo} />

      <div className="p-5">
        {paleta.promocionada && (
          <p
            className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: "#057305", color: "#FFFFFF", fontWeight: 700 }}
          >
            <Star size={11} aria-hidden /> Destacada
          </p>
        )}
        <p className="text-[13px]" style={{ color: "#5B6470" }}>
          {paleta.marca}
        </p>
        <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 22 }}>{paleta.modelo}</h1>
        <p className="mt-1 text-[26px]" style={{ color: "#057305", fontWeight: 800 }}>
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
            style={{ background: "#057305", fontWeight: 700 }}
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

      {/* Al dueño no le sirve escribirse por WhatsApp a si mismo: ve lo suyo.
          Sin sesion se ve la publicacion entera pero no el contacto: el href con
          el telefono ni se renderiza, asi que el numero no viaja al cliente. */}
      <div className="px-5">
        {!esDueno ? (
          logueado ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: "#128C4B", fontWeight: 700, outlineColor: "#057305" }}
            >
              <MessageCircle size={19} aria-hidden /> Contactar por WhatsApp
            </a>
          ) : (
            <>
              <Link
                href={`/auth?next=${encodeURIComponent(`/paletas/${paleta.id}`)}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: "#128C4B", fontWeight: 700, outlineColor: "#057305" }}
              >
                <MessageCircle size={19} aria-hidden /> Iniciá sesión para contactar
              </Link>
              <p className="mt-2 text-center text-[13px]" style={{ color: "#5B6470" }}>
                Es gratis y te lleva de vuelta a esta paleta.
              </p>
            </>
          )
        ) : paleta.promocionada ? (
          <p
            className="flex items-center justify-center gap-2 rounded-[14px] py-3 text-[14px]"
            style={{ background: "rgba(5,115,5,0.08)", color: "#057305", fontWeight: 600 }}
          >
            <Star size={16} aria-hidden /> Promocionada: aparece primero en las búsquedas
          </p>
        ) : (
          <PromocionarDialog
            id={paleta.id}
            titulo={titulo}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#057305] bg-[#057305]"
          />
        )}
      </div>
    </div>
  );
}
