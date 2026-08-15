// Lecturas del panel de superadmin. Solo servidor, y todas con la service role
// key: el panel mira publicaciones y usuarios ajenos, o sea justo lo que las
// policies de RLS estan para impedir. El unico control de acceso es
// exigirAdmin() en lib/admin.ts.
import { admin } from "@/lib/supabase/admin";
import { conReintento } from "@/lib/reintentar";
import { limpiarBusqueda } from "@/lib/validar";
import { paginaActual, type EstadoPublicacion } from "@/lib/paletas";

/** Filas por pagina del panel. Son listas densas, no la grilla del feed. */
export const POR_PAGINA_ADMIN = 30;

/**
 * Ventanas del resumen. El orden es el de los botones del panel.
 *
 * 'total' no es una ventana movil: agrupa por mes desde el primer dato que
 * exista.
 */
export const RANGOS = ["dia", "semana", "mes", "anio", "total"] as const;
export type Rango = (typeof RANGOS)[number];

export const RANGO_POR_DEFECTO: Rango = "mes";

/** El `rango` de la URL, o el default si viene cualquier cosa. */
export const rangoActual = (v: string | undefined): Rango =>
  RANGOS.includes(v as Rango) ? (v as Rango) : RANGO_POR_DEFECTO;

/** Un punto de la serie. Todas las metricas del mismo bucket, ya en 0 si no hubo nada. */
export type PuntoSerie = {
  /** Inicio del bucket, "YYYY-MM-DD". La unidad la da `Estadisticas.unidad`. */
  periodo: string;
  paletas: number;
  promociones: number;
  /** Bruto del periodo, en pesos enteros. */
  ingresos: number;
  usuarios: number;
  /** Personas distintas que publicaron, pagaron o promocionaron en el periodo. */
  activos: number;
};

export type Estadisticas = {
  rango: Rango;
  /** Unidad de los buckets de `serie`, como la usa date_trunc. */
  unidad: "day" | "week" | "month" | "year";
  paletas: {
    activas: number;
    vencidas: number;
    pausadas: number;
    vendidas: number;
    bajas: number;
    total: number;
  };
  promociones: { activas: number; total: number };
  usuarios: { total: number; baneados: number };
  /** Bruto, en pesos enteros: suma de los pagos aprobados, sin descontar MP. */
  ganancia: number;
  /** Promociones del rango abiertas por origen. Las tres claves siempre vienen. */
  tipos: { premium: number; individual: number; cortesia: number };
  /**
   * Las mismas promociones abiertas por plan. `otras` junta todo lo que no es
   * 15 ni 30 dias: premium y cortesia entran por otro camino y pueden traer
   * cualquier plazo. Suma lo mismo que `tipos`.
   */
  duraciones: { d15: number; d30: number; otras: number };
  serie: PuntoSerie[];
};

export type PublicacionAdmin = {
  id: string;
  modelo: string;
  marca: string;
  precio: number;
  visitas: number;
  fotos: string[];
  /** Se muestra en la lista: es lo que se modera, y una baja no tiene pagina publica. */
  descripcion: string;
  estado_publicacion: EstadoPublicacion;
  vence_at: string;
  created_at: string;
  vendedor_id: string;
  vendedor: string;
};

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  apellido: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
  baneado: boolean;
  paletas: number;
};

export type FiltrosAdmin = {
  q?: string;
  estado?: string;
  vendedor?: string;
  pagina?: string;
};

export const ESTADOS_PUBLICACION: EstadoPublicacion[] = [
  "activa",
  "pausada",
  "vendida",
  "eliminada",
];

/** Todo el resumen en una RPC: agrupa por periodo y PostgREST no hace group by. */
export async function estadisticasAdmin(rango: Rango): Promise<Estadisticas> {
  const data = await conReintento(() =>
    admin().rpc("estadisticas_admin", { p_rango: rango }),
  );
  return data as unknown as Estadisticas;
}

/**
 * `hayMas` sale de pedir una fila de mas, igual que el feed (lib/paletas-db.ts):
 * la navegacion solo necesita saber si existe la pagina siguiente.
 */
export async function listarPublicacionesAdmin(
  f: FiltrosAdmin,
): Promise<{ publicaciones: PublicacionAdmin[]; hayMas: boolean }> {
  const busqueda = f.q ? limpiarBusqueda(f.q) : "";
  const desde = (paginaActual(f.pagina) - 1) * POR_PAGINA_ADMIN;

  const data = await conReintento(() => {
    let query = admin()
      .from("paletas")
      .select(
        "id, modelo, precio, visitas, fotos, descripcion, estado_publicacion, vence_at, created_at, vendedor_id, marcas (nombre), perfiles (nombre, apellido)",
      )
      .order("created_at", { ascending: false })
      // range es inclusivo de los dos lados: esto pide POR_PAGINA_ADMIN + 1.
      .range(desde, desde + POR_PAGINA_ADMIN);

    if (busqueda) query = query.ilike("modelo", `%${busqueda}%`);
    if (f.estado && ESTADOS_PUBLICACION.includes(f.estado as EstadoPublicacion)) {
      query = query.eq("estado_publicacion", f.estado);
    }
    if (f.vendedor) query = query.eq("vendedor_id", f.vendedor);

    return query;
  });

  const filas = ((data ?? []) as unknown as (Omit<
    PublicacionAdmin,
    "marca" | "vendedor"
  > & {
    marcas: { nombre: string } | null;
    perfiles: { nombre: string; apellido: string } | null;
  })[]).map(({ marcas, perfiles, ...p }) => ({
    ...p,
    marca: marcas?.nombre ?? "",
    vendedor: [perfiles?.nombre, perfiles?.apellido].filter(Boolean).join(" ") || "—",
  }));

  return {
    publicaciones: filas.slice(0, POR_PAGINA_ADMIN),
    hayMas: filas.length > POR_PAGINA_ADMIN,
  };
}

export async function listarUsuariosAdmin(
  f: FiltrosAdmin,
): Promise<{ usuarios: UsuarioAdmin[]; hayMas: boolean }> {
  const busqueda = f.q ? limpiarBusqueda(f.q) : "";
  const desde = (paginaActual(f.pagina) - 1) * POR_PAGINA_ADMIN;

  const data = await conReintento(() => {
    let query = admin()
      .from("admin_usuarios")
      .select("id, nombre, apellido, whatsapp, email, created_at, baneado, paletas")
      .order("created_at", { ascending: false })
      .range(desde, desde + POR_PAGINA_ADMIN);

    if (busqueda) {
      query = query.or(
        `nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,email.ilike.%${busqueda}%`,
      );
    }

    return query;
  });

  const filas = (data ?? []) as unknown as UsuarioAdmin[];
  return {
    usuarios: filas.slice(0, POR_PAGINA_ADMIN),
    hayMas: filas.length > POR_PAGINA_ADMIN,
  };
}
