import Link from "next/link";
import { UserX } from "lucide-react";
import { Paginacion } from "@/components/paginacion";
import { Confirmar } from "@/components/admin/confirmar";
import { banear, desbanear } from "@/app/admin/actions";
import {
  listarUsuariosAdmin,
  type FiltrosAdmin,
  type UsuarioAdmin,
} from "@/lib/admin-db";
import { paginaActual } from "@/lib/paletas";

const FECHA = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

function Fila({ u }: { u: UsuarioAdmin }) {
  const nombre = [u.nombre, u.apellido].filter(Boolean).join(" ") || "Sin nombre";

  return (
    <li
      className="flex flex-wrap items-start gap-3 rounded-[14px] p-3"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="min-w-0 flex-1 basis-[200px]">
        <p className="flex flex-wrap items-center gap-2 text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {nombre}
          {u.baneado && (
            <span
              className="rounded-full px-2 py-0.5 text-[12px]"
              style={{ background: "rgba(212,24,61,0.08)", color: "#D4183D", fontWeight: 600 }}
            >
              Baneado
            </span>
          )}
        </p>
        <p className="truncate text-[13px]" style={{ color: "#5B6470" }}>
          {u.email ?? "Sin email"}
        </p>
        <div
          className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
          style={{ color: "#5B6470" }}
        >
          {u.whatsapp && <span>{u.whatsapp}</span>}
          <span>Desde {FECHA.format(new Date(u.created_at))}</span>
          <Link
            href={`/admin/publicaciones?vendedor=${u.id}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "#057305", fontWeight: 600, textDecoration: "underline", outlineColor: "#057305" }}
          >
            {u.paletas.toLocaleString("es-AR")}{" "}
            {u.paletas === 1 ? "publicación" : "publicaciones"}
          </Link>
        </div>
      </div>

      <div className="shrink-0">
        {u.baneado ? (
          <Confirmar
            accion={desbanear}
            id={u.id}
            etiqueta="Desbanear"
            titulo="¿Desbanear a esta persona?"
            detalle={`${nombre} va a poder volver a entrar. Sus publicaciones NO se reactivan solas: hay que hacerlo una por una desde Publicaciones.`}
            confirmar="Desbanear"
            cargando="Desbaneando…"
          />
        ) : (
          <Confirmar
            accion={banear}
            id={u.id}
            etiqueta="Banear"
            titulo="¿Banear a esta persona?"
            detalle={`${nombre} no va a poder volver a entrar y todas sus publicaciones activas y pausadas se dan de baja. Se puede revertir.`}
            confirmar="Banear"
            cargando="Baneando…"
            peligro
          />
        )}
      </div>
    </li>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltrosAdmin>;
}) {
  const f = await searchParams;
  const { usuarios, hayMas } = await listarUsuariosAdmin(f);
  const pagina = paginaActual(f.pagina);

  return (
    <div className="space-y-4">
      {/* GET nativo: la busqueda queda en la URL, sin estado ni javascript. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="block text-[13px]" style={{ color: "#5B6470" }}>
            Buscar por nombre o email
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={f.q ?? ""}
            className="mt-1 min-h-[44px] w-full rounded-[14px] px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", color: "#14171A", outlineColor: "#057305" }}
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-[14px] px-4 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
        >
          Buscar
        </button>
      </form>

      {usuarios.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center"
          style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "#F2F1ED" }}
          >
            <UserX size={28} style={{ color: "#057305" }} aria-hidden />
          </div>
          <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
            No encontramos usuarios
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
            Probá con otro nombre o email.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((u) => (
            <Fila key={u.id} u={u} />
          ))}
        </ul>
      )}

      <Paginacion base="/admin/usuarios" filtros={f} pagina={pagina} hayMas={hayMas} />
    </div>
  );
}
