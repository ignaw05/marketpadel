import { Receipt } from "lucide-react";
import { ImageWithFallback } from "../image-with-fallback";
import { Venta, formatPrecio, estadoLabel, foto } from "@/lib/paletas";

const FECHA = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

function Card({ venta }: { venta: Venta }) {
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
          src={foto(venta)}
          alt={`${venta.marca} ${venta.modelo}`}
          sizes="64px"
          className="object-contain p-1"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {venta.marca} {venta.modelo}
        </p>
        <p className="text-[15px]" style={{ color: "#057305", fontWeight: 700 }}>
          {formatPrecio(venta.precio)}
        </p>
        <div
          className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
          style={{ color: "#5B6470" }}
        >
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: "#F2F1ED", color: "#14171A", fontWeight: 600 }}
          >
            {venta.estado}/10 · {estadoLabel(venta.estado)}
          </span>
          <span>{FECHA.format(new Date(venta.vendida_at))}</span>
        </div>
      </div>
    </div>
  );
}

export function HistorialVentas({
  ventas,
  titulo = "Historial de ventas",
  subtitulo,
  vacioTitulo = "Todavía no vendiste ninguna paleta",
  vacioTexto = "Cuando marques una publicación como vendida, va a aparecer acá.",
}: {
  ventas: Venta[];
  titulo?: string;
  subtitulo?: string;
  vacioTitulo?: string;
  vacioTexto?: string;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>{titulo}</h1>
      {subtitulo && (
        <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
          {subtitulo}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {ventas.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center"
            style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "#F2F1ED" }}
            >
              <Receipt size={28} style={{ color: "#057305" }} aria-hidden />
            </div>
            <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
              {vacioTitulo}
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
              {vacioTexto}
            </p>
          </div>
        ) : (
          ventas.map((v) => <Card key={v.id} venta={v} />)
        )}
      </div>
    </div>
  );
}
