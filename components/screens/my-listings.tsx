import Link from "next/link";
import { PackageOpen, Plus, Eye, CheckCircle2, Star, AlertCircle, Receipt, Heart } from "lucide-react";
import { ImageWithFallback } from "../image-with-fallback";
import { AccionesPaleta } from "../acciones-paleta";
import { PromocionarDialog } from "../promocionar-dialog";
import { Renovar } from "../renovar";
import { MarcarVendida } from "../marcar-vendida";
import { Metric } from "../metric";
import {
  Paleta,
  formatPrecio,
  foto,
  diasParaVencer,
  puedeRenovar,
  vencida,
} from "@/lib/paletas";

const BADGE = {
  activa: { texto: "Activa", fondo: "rgba(5,115,5,0.1)", color: "#057305" },
  pausada: { texto: "Pausada", fondo: "#F2F1ED", color: "#5B6470" },
  vendida: { texto: "Vendida", fondo: "rgba(20,23,26,0.08)", color: "#14171A" },
  eliminada: { texto: "Eliminada", fondo: "#F2F1ED", color: "#5B6470" },
  vencida: { texto: "Vencida", fondo: "rgba(212,24,61,0.08)", color: "#D4183D" },
} as const;

/** El vencimiento solo cambia algo mientras la publicacion sigue en juego. */
const EN_JUEGO = ["activa", "pausada"];

function Row({ paleta, recienPublicada }: { paleta: Paleta; recienPublicada: boolean }) {
  const estado = paleta.estado_publicacion ?? "activa";
  const expirada = vencida(paleta);
  const enJuego = EN_JUEGO.includes(estado);
  const badge = enJuego && expirada ? BADGE.vencida : BADGE[estado];
  const dias = diasParaVencer(paleta.vence_at);
  const avisar = enJuego && (expirada || puedeRenovar(paleta));
  const titulo = `${paleta.marca} ${paleta.modelo}`;

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
          mini
          className="object-contain p-1"
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/paletas/${paleta.id}`}
          className="block truncate text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
        >
          {titulo}
        </Link>
        <p className="text-[15px]" style={{ color: "#057305", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <div
          className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
          style={{ color: "#5B6470" }}
        >
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: badge.fondo, color: badge.color, fontWeight: 600 }}
          >
            {badge.texto}
          </span>
          {paleta.promocionada ? (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ background: "#057305", color: "#FFFFFF", fontWeight: 600 }}
            >
              <Star size={11} aria-hidden /> Promocionada
            </span>
          ) : estado === "activa" && !expirada ? (
            <PromocionarDialog
              id={paleta.id}
              titulo={`${paleta.marca} ${paleta.modelo}`}
              auto={recienPublicada}
              className="inline-flex items-center gap-1 rounded-full border border-[#057305] px-2.5 py-0.5 text-[12px] font-semibold text-[#057305] hover:bg-[rgba(5,115,5,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#057305]"
            />
          ) : null}
          {enJuego && <MarcarVendida id={paleta.id} titulo={titulo} />}
          <span className="flex items-center gap-1">
            <Eye size={12} aria-hidden /> {paleta.visitas.toLocaleString("es-AR")}
            <span className="sr-only">visitas</span>
          </span>
        </div>

        {avisar && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-[12px]" style={{ color: expirada ? "#D4183D" : "#5B6470" }}>
              {expirada
                ? "Ya no se muestra en las búsquedas."
                : dias === 0
                  ? "Vence hoy."
                  : `Vence en ${dias} ${dias === 1 ? "día" : "días"}.`}
            </p>
            <Renovar id={paleta.id} titulo={titulo} />
          </div>
        )}
      </div>

      <AccionesPaleta paleta={paleta} />
    </div>
  );
}

// La vuelta de MercadoPago no confirma nada: quien promociona es el webhook, y
// el usuario puede llegar antes. Por eso "exito" no promete que ya este activa.
const AVISO_PAGO = {
  exito: {
    texto: "Pago aprobado. La promoción se activa en unos segundos; si todavía no la ves, recargá.",
    fondo: "rgba(5,115,5,0.08)",
    color: "#057305",
    alerta: false,
  },
  pendiente: {
    texto: "Tu pago quedó pendiente. Apenas MercadoPago lo apruebe, la promoción se activa sola.",
    fondo: "#F2F1ED",
    color: "#14171A",
    alerta: false,
  },
  error: {
    texto: "El pago no se completó. No te cobramos nada, podés intentar de nuevo.",
    fondo: "rgba(212,24,61,0.08)",
    color: "#D4183D",
    alerta: true,
  },
} as const;

// La donacion sí la confirma la vuelta: /api/donacion le pregunta a MP por el
// pago antes de marcar nada, asi que aca ya esta todo hecho.
const AVISO_DONACION = {
  exito: {
    texto: "¡Gracias por tu donación! Marcamos la publicación como vendida.",
    fondo: "rgba(5,115,5,0.08)",
    color: "#057305",
    alerta: false,
  },
  pendiente: {
    texto:
      "Tu donación quedó pendiente de aprobación. La publicación todavía no se marcó como vendida: podés marcarla con el botón “La vendí”.",
    fondo: "#F2F1ED",
    color: "#14171A",
    alerta: false,
  },
  error: {
    texto:
      "La donación no se completó. No te cobramos nada, y la publicación sigue como estaba.",
    fondo: "rgba(212,24,61,0.08)",
    color: "#D4183D",
    alerta: true,
  },
} as const;

type Aviso = { texto: string; fondo: string; color: string; alerta: boolean };

function Banner({ aviso, Icono }: { aviso: Aviso; Icono: typeof Star }) {
  return (
    <p
      role={aviso.alerta ? "alert" : "status"}
      className="mt-4 flex items-start gap-2 rounded-[14px] p-3 text-[14px]"
      style={{ background: aviso.fondo, color: aviso.color, lineHeight: 1.5 }}
    >
      {aviso.alerta ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <Icono size={16} className="mt-0.5 shrink-0" aria-hidden />
      )}
      {aviso.texto}
    </p>
  );
}

export function MyListings({
  paletas,
  publicada,
  editada,
  pago,
  donacion,
}: {
  paletas: Paleta[];
  /** Id de la que se acaba de publicar: abre sola la invitacion a promocionar. */
  publicada?: string;
  editada?: boolean;
  pago?: string;
  donacion?: string;
}) {
  const aviso = AVISO_PAGO[pago as keyof typeof AVISO_PAGO];
  const gracias = AVISO_DONACION[donacion as keyof typeof AVISO_DONACION];
  // Una vencida no cuenta como activa: no la ve nadie.
  const activas = paletas.filter(
    (p) => p.estado_publicacion === "activa" && !vencida(p),
  ).length;
  const vendidas = paletas.filter((p) => p.estado_publicacion === "vendida").length;
  const visitas = paletas.reduce((s, p) => s + p.visitas, 0);

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Mis publicaciones</h1>
        <Link
          href="/mis-publicaciones/ventas"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
        >
          <Receipt size={14} aria-hidden /> Mis ventas
        </Link>
      </div>

      {publicada && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-[14px] p-3 text-[14px]"
          style={{ background: "rgba(5,115,5,0.08)", color: "#057305" }}
        >
          <CheckCircle2 size={16} aria-hidden /> ¡Paleta publicada! Ya está visible para todos.
        </p>
      )}

      {editada && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-[14px] p-3 text-[14px]"
          style={{ background: "rgba(5,115,5,0.08)", color: "#057305" }}
        >
          <CheckCircle2 size={16} aria-hidden /> Cambios guardados.
        </p>
      )}

      {aviso && <Banner aviso={aviso} Icono={Star} />}

      {gracias && <Banner aviso={gracias} Icono={Heart} />}

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
              <PackageOpen size={28} style={{ color: "#057305" }} aria-hidden />
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
              style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
            >
              <Plus size={16} aria-hidden /> Publicar tu primera paleta
            </Link>
          </div>
        ) : (
          paletas.map((p) => (
            <Row key={p.id} paleta={p} recienPublicada={p.id === publicada} />
          ))
        )}
      </div>
    </div>
  );
}
