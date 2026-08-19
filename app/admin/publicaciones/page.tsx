import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Paginacion } from "@/components/paginacion";
import { Confirmar } from "@/components/admin/confirmar";
import { bajarPublicacion, reactivarPublicacion } from "@/app/admin/actions";
import {
  listarPublicacionesAdmin,
  ESTADOS_PUBLICACION,
  type FiltrosAdmin,
  type PublicacionAdmin,
} from "@/lib/admin-db";
import { formatPrecio, foto, paginaActual, vencida } from "@/lib/paletas";

const FECHA = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

const BADGE = {
  activa: { texto: "Activa", fondo: "rgba(5,115,5,0.1)", color: "#057305" },
  pausada: { texto: "Pausada", fondo: "#F2F1ED", color: "#5B6470" },
  vendida: { texto: "Vendida", fondo: "rgba(20,23,26,0.08)", color: "#14171A" },
  eliminada: { texto: "Dada de baja", fondo: "rgba(212,24,61,0.08)", color: "#D4183D" },
  vencida: { texto: "Vencida", fondo: "#F2F1ED", color: "#5B6470" },
} as const;

const ETIQUETA_FILTRO: Record<string, string> = {
  activa: "Activas",
  pausada: "Pausadas",
  vendida: "Vendidas",
  eliminada: "Dadas de baja",
};

const campo =
  "min-h-[44px] w-full rounded-[14px] px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2";
const campoStyle = {
  background: "#FFFFFF",
  border: "1px solid #E6E4DF",
  color: "#14171A",
  outlineColor: "#057305",
} as const;

/** GET nativo: los filtros quedan en la URL y el back del navegador funciona. */
function Filtros({ f }: { f: FiltrosAdmin }) {
  return (
    <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      {/* La pagina se resetea al filtrar: no se propaga el parametro. */}
      {f.vendedor && <input type="hidden" name="vendedor" value={f.vendedor} />}

      <div>
        <label htmlFor="q" className="block text-[13px]" style={{ color: "#5B6470" }}>
          Buscar por modelo
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={f.q ?? ""}
          className={`mt-1 ${campo}`}
          style={campoStyle}
        />
      </div>

      <div>
        <label htmlFor="estado" className="block text-[13px]" style={{ color: "#5B6470" }}>
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={f.estado ?? ""}
          className={`mt-1 ${campo} sm:w-44`}
          style={campoStyle}
        >
          <option value="">Todos</option>
          {ESTADOS_PUBLICACION.map((e) => (
            <option key={e} value={e}>
              {ETIQUETA_FILTRO[e]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="min-h-[44px] self-end rounded-[14px] px-4 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
      >
        Filtrar
      </button>
    </form>
  );
}

function Fila({ p }: { p: PublicacionAdmin }) {
  const baja = p.estado_publicacion === "eliminada";
  const enJuego = p.estado_publicacion === "activa" || p.estado_publicacion === "pausada";
  const badge =
    enJuego && vencida(p) ? BADGE.vencida : BADGE[p.estado_publicacion];
  const titulo = `${p.marca} ${p.modelo}`;

  return (
    <li
      className="flex flex-wrap items-start gap-3 rounded-[14px] p-3"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px]"
        style={{ background: "#F2F1ED" }}
      >
        <ImageWithFallback
          src={foto(p)}
          alt={titulo}
          sizes="64px"
          mini
          className="object-contain p-1"
        />
      </div>

      <div className="min-w-0 flex-1 basis-[200px]">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {titulo}
        </p>
        <p className="text-[15px]" style={{ color: "#057305", fontWeight: 700 }}>
          {formatPrecio(p.precio)}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px]" style={{ color: "#5B6470" }}>
          {p.descripcion}
        </p>
        <div
          className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
          style={{ color: "#5B6470" }}
        >
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: badge.fondo, color: badge.color, fontWeight: 600 }}
          >
            {badge.texto}
          </span>
          <Link
            href={`/admin/usuarios?q=${encodeURIComponent(p.vendedor)}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "#5B6470", textDecoration: "underline", outlineColor: "#057305" }}
          >
            {p.vendedor}
          </Link>
          <span>{FECHA.format(new Date(p.created_at))}</span>
          <span>{p.visitas.toLocaleString("es-AR")} visitas</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {!baja && (
          <Link
            href={`/paletas/${p.id}`}
            className="flex min-h-[44px] items-center rounded-[14px] px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
          >
            Ver
          </Link>
        )}
        {baja ? (
          <Confirmar
            accion={reactivarPublicacion}
            id={p.id}
            etiqueta="Reactivar"
            titulo="¿Reactivar la publicación?"
            detalle={`“${titulo}” vuelve al feed y a Mis publicaciones del vendedor.`}
            confirmar="Reactivar"
            cargando="Reactivando…"
          />
        ) : (
          <Confirmar
            accion={bajarPublicacion}
            id={p.id}
            etiqueta="Dar de baja"
            titulo="¿Dar de baja la publicación?"
            detalle={`“${titulo}” sale del feed y del listado del vendedor. Se puede reactivar desde acá.`}
            confirmar="Dar de baja"
            cargando="Bajando…"
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
  const { publicaciones, hayMas } = await listarPublicacionesAdmin(f);
  const pagina = paginaActual(f.pagina);

  return (
    <div className="space-y-4">
      <Filtros f={f} />

      {f.vendedor && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-[14px] p-3 text-[14px]"
          style={{ background: "#F2F1ED", color: "#14171A" }}
        >
          Viendo solo las publicaciones de un vendedor.
          <Link
            href="/admin/publicaciones"
            className="focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "#057305", fontWeight: 600, textDecoration: "underline", outlineColor: "#057305" }}
          >
            Ver todas
          </Link>
        </p>
      )}

      {publicaciones.length === 0 ? (
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
            No hay publicaciones con esos filtros
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
            Probá con otro estado o sin texto de búsqueda.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {publicaciones.map((p) => (
            <Fila key={p.id} p={p} />
          ))}
        </ul>
      )}

      <Paginacion base="/admin/publicaciones" filtros={f} pagina={pagina} hayMas={hayMas} />
    </div>
  );
}
