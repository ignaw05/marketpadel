import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Confirmar } from "@/components/admin/confirmar";
import { SponsorForm } from "@/components/admin/sponsor-form";
import { alternarSponsor, borrarSponsor, ordenarSponsor } from "./actions";
import { listarSponsorsAdmin, type SponsorAdmin } from "@/lib/admin-db";

function Fila({ s }: { s: SponsorAdmin }) {
  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-[14px] p-3"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        // El desactivado se sigue leyendo, pero se nota que no esta en la tira.
        opacity: s.activo ? 1 : 0.55,
      }}
    >
      <div
        className="relative h-10 w-[104px] shrink-0 overflow-hidden rounded-[10px]"
        style={{ background: "#FBF9F5" }}
      >
        <Image src={s.logo_url} alt="" fill sizes="104px" className="object-contain p-1" />
      </div>

      <div className="min-w-0 flex-1 basis-[180px]">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {s.nombre}
        </p>
        {s.link ? (
          <a
            href={s.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "#5B6470", textDecoration: "underline", outlineColor: "#057305" }}
          >
            {s.link}
          </a>
        ) : (
          <p className="text-[13px]" style={{ color: "#5B6470" }}>
            Sin link
          </p>
        )}
      </div>

      <form action={ordenarSponsor} className="flex shrink-0 items-end gap-2">
        <input type="hidden" name="id" value={s.id} />
        <div>
          <label
            htmlFor={`orden-${s.id}`}
            className="block text-[12px]"
            style={{ color: "#5B6470" }}
          >
            Orden
          </label>
          <input
            id={`orden-${s.id}`}
            name="orden"
            type="number"
            inputMode="numeric"
            defaultValue={s.orden}
            className="mt-1 min-h-[44px] w-20 rounded-[14px] px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E4DF",
              color: "#14171A",
              outlineColor: "#057305",
            }}
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-[14px] px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            border: "1px solid #E6E4DF",
            color: "#14171A",
            fontWeight: 600,
            outlineColor: "#057305",
          }}
        >
          Guardar
        </button>
      </form>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <form action={alternarSponsor}>
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="activo" value={s.activo ? "0" : "1"} />
          <button
            type="submit"
            className="min-h-[44px] rounded-[14px] px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              border: "1px solid #E6E4DF",
              color: "#14171A",
              fontWeight: 600,
              outlineColor: "#057305",
            }}
          >
            {s.activo ? "Desactivar" : "Activar"}
          </button>
        </form>

        <Confirmar
          accion={borrarSponsor}
          id={s.id}
          etiqueta="Eliminar"
          titulo="¿Eliminar el sponsor?"
          detalle={`“${s.nombre}” y su logo se borran para siempre. Si es por un tiempo, usá Desactivar.`}
          confirmar="Eliminar"
          cargando="Eliminando…"
          peligro
        />
      </div>
    </li>
  );
}

export default async function Page() {
  const sponsors = await listarSponsorsAdmin();

  return (
    <div className="space-y-4">
      <SponsorForm />

      {sponsors.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center"
          style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "#F2F1ED" }}
          >
            <ImageOff size={28} style={{ color: "#057305" }} aria-hidden />
          </div>
          <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
            Todavía no hay sponsors
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
            Mientras no haya ninguno activo, la tira no aparece en el sitio.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sponsors.map((s) => (
            <Fila key={s.id} s={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
