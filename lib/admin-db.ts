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
  /** Inicio del bucket, "YYYY-MM-DD". La unidad la da `unidad`. */
  periodo: string;
  paletas: number;
  promociones: number;
  /** Bruto del periodo, en pesos enteros. */
  ingresos: number;
  usuarios: number;
  /** Personas distintas que publicaron, pagaron o promocionaron en el periodo. */
  activos: number;
};

export type Unidad = "day" | "week" | "month" | "year";

/** Las metricas que se pueden comparar contra la ventana anterior. */
export type Movimiento = {
  paletas: number;
  promociones: number;
  ingresos: number;
  usuarios: number;
};

/**
 * Lo accionable del resumen: cada clave es una fila clickeable del panel.
 * La UI esconde las que dan 0, y si dan todas 0 muestra el estado tranquilo.
 */
export type Atencion = {
  vencen_pronto: number;
  ya_vencidas: number;
  sin_foto: number;
  pagos_problema: number;
};

export type Resumen = {
  rango: Rango;
  unidad: Unidad;
  /** false en el rango 'total', que no tiene ventana anterior contra que medir. */
  comparable: boolean;
  totales: {
    activas: number;
    vencidas: number;
    pausadas: number;
    vendidas: number;
    bajas: number;
    total: number;
    visitas: number;
  };
  promociones_vigentes: number;
  usuarios: number;
  /** Bruto historico, en pesos enteros: los pagos aprobados sin descontar MP. */
  ganancia: number;
  /** Promedio de dias entre publicar y marcar vendida. null si no vendio nadie. */
  dias_hasta_venta: number | null;
  periodo: Movimiento;
  /** null cuando `comparable` es false: distinto de "no hubo movimiento". */
  anterior: Movimiento | null;
  atencion: Atencion;
  serie: PuntoSerie[];
};

export type ConceptoPago = "promocion" | "suscripcion" | "donacion";
export type EstadoPago = "aprobado" | "pendiente" | "rechazado" | "devuelto";

export type PagoAdmin = {
  id: string;
  concepto: ConceptoPago;
  estado: EstadoPago;
  monto: number;
  created_at: string;
  /** Nombre y apellido del perfil que pago, o "Sin nombre". */
  persona: string;
};

export type Dinero = {
  rango: Rango;
  unidad: Unidad;
  comparable: boolean;
  bruto: { periodo: number; anterior: number | null; historico: number };
  /** null cuando no hubo ningun pago aprobado en la ventana. */
  ticket: number | null;
  /** Porcentaje 0-100. null cuando no hubo ningun intento de pago. */
  tasa_aprobacion: number | null;
  pagos: { total: number; aprobados: number };
  /** Montos, no cantidades: de donde sale la plata. */
  por_concepto: Record<ConceptoPago, number>;
  /** Cantidades, no montos: intentos de cobro. */
  por_estado: Record<EstadoPago, number>;
  tipos: { premium: number; individual: number; cortesia: number };
  duraciones: { d15: number; d30: number; otras: number };
  suscripciones: {
    vigentes: number;
    pro_vigentes: number;
    creditos_usados: number;
    creditos_totales: number;
  };
  ultimos: PagoAdmin[];
};

/**
 * Una fila de ranking. `agrupadas` viene en null en las filas reales y trae la
 * cantidad plegada en la fila "Otras...", que siempre va ultima.
 */
export type FilaRanking = { nombre: string; n: number; agrupadas: number | null };

export type Catalogo = {
  total: number;
  activas: number;
  precio: {
    promedio: number | null;
    mediana: number | null;
    min: number | null;
    max: number | null;
  };
  precio_vendidas: number | null;
  visitas: { total: number; promedio: number | null };
  dias_hasta_venta: { promedio: number | null; mediana: number | null };
  permuta: { si: number; activas: number };
  marcas: FilaRanking[];
  provincias: FilaRanking[];
  /** Cortes fijos: <100k, 100-200k, 200-300k, 300-500k, 500k+. */
  precios: { b1: number; b2: number; b3: number; b4: number; b5: number };
  formas: { diamante: number; lagrima: number; redonda: number };
  /** Los 10 valores siempre, incluso los que dan 0. */
  estado: { valor: number; n: number }[];
  top_visitas: {
    id: string;
    marca: string;
    modelo: string;
    provincia: string;
    precio: number;
    visitas: number;
  }[];
};

export type Gente = {
  /**
   * Personas distintas en cada escalon. No son subconjuntos estrictos: se
   * puede vender sin haber promocionado nunca.
   */
  embudo: {
    registrados: number;
    publicaron: number;
    promocionaron: number;
    vendieron: number;
  };
  sin_publicar: number;
  pro_vigentes: number;
  top_vendedores: {
    id: string;
    nombre: string;
    paletas: number;
    vendidas: number;
    visitas: number;
  }[];
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
  /** "1" para ver solo las que no tienen ninguna foto. */
  sinfoto?: string;
};

/**
 * Los valores del filtro `estado`: los cuatro estados de la columna mas dos
 * cortes por vencimiento.
 *
 * Los dos ultimos van en el MISMO parametro y no en uno aparte a proposito:
 * "vencidas" ya implica estado activa, asi que como parametros separados
 * podrian contradecirse (?estado=vendida&vence=vencida) y devolver una lista
 * vacia sin decir por que. En un solo select eso no se puede escribir.
 */
export const FILTROS_ESTADO = [
  { valor: "activa", texto: "Activas" },
  { valor: "pausada", texto: "Pausadas" },
  { valor: "vendida", texto: "Vendidas" },
  { valor: "eliminada", texto: "Dadas de baja" },
  { valor: "vencen", texto: "Vencen esta semana" },
  { valor: "vencidas", texto: "Ya vencidas" },
] as const;

export const ESTADOS_PUBLICACION: EstadoPublicacion[] = [
  "activa",
  "pausada",
  "vendida",
  "eliminada",
];

// Una RPC por pantalla y no un jsonb unico: cada pantalla es su propia ruta y
// si compartieran la lectura, todas pagarian el agregado completo para dibujar
// un cuarto de el. Las cuatro agrupan por periodo o por categoria, y PostgREST
// no hace group by.

export async function panelResumen(rango: Rango): Promise<Resumen> {
  const data = await conReintento(() =>
    admin().rpc("panel_resumen", { p_rango: rango }),
  );
  return data as unknown as Resumen;
}

export async function panelDinero(rango: Rango): Promise<Dinero> {
  const data = await conReintento(() =>
    admin().rpc("panel_dinero", { p_rango: rango }),
  );
  return data as unknown as Dinero;
}

/** Sin rango: es una foto del catalogo de ahora, no una ventana movil. */
export async function panelCatalogo(): Promise<Catalogo> {
  const data = await conReintento(() => admin().rpc("panel_catalogo"));
  return data as unknown as Catalogo;
}

/** Idem: el embudo es acumulado desde siempre, no del mes. */
export async function panelGente(): Promise<Gente> {
  const data = await conReintento(() => admin().rpc("panel_gente"));
  return data as unknown as Gente;
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
    if (f.vendedor) query = query.eq("vendedor_id", f.vendedor);

    // Los dos cortes por vencimiento son sobre las activas: una vencida sigue
    // diciendo 'activa' en la columna, que es justo el problema que senalan.
    const ahora = new Date().toISOString();
    if (f.estado === "vencen") {
      query = query
        .eq("estado_publicacion", "activa")
        .gt("vence_at", ahora)
        .lte("vence_at", new Date(Date.now() + 7 * 86400000).toISOString());
    } else if (f.estado === "vencidas") {
      query = query.eq("estado_publicacion", "activa").lte("vence_at", ahora);
    } else if (f.estado && ESTADOS_PUBLICACION.includes(f.estado as EstadoPublicacion)) {
      query = query.eq("estado_publicacion", f.estado);
    }

    // `fotos` es text[] not null default '{}', asi que "sin foto" es la
    // igualdad con el array vacio: cardinality() no se puede pedir por
    // PostgREST.
    if (f.sinfoto === "1") query = query.eq("fotos", "{}");

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

// ---------------------------------------------------------------- sponsors

export type SponsorAdmin = {
  id: string;
  nombre: string;
  logo_url: string;
  link: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
};

/**
 * Todos los sponsors, activos y desactivados. No sirve listarSponsors() de
 * lib/sponsors-db: esa va con el cliente publico y la policy de RLS le esconde
 * los inactivos, que son justo los que el panel tiene que poder reactivar.
 */
export async function listarSponsorsAdmin(): Promise<SponsorAdmin[]> {
  const data = await conReintento(() =>
    admin()
      .from("sponsors")
      .select("id, nombre, logo_url, link, orden, activo, created_at")
      // Los desactivados al final: el panel muestra primero lo que se esta viendo.
      .order("activo", { ascending: false })
      .order("orden")
      .order("created_at"),
  );

  return (data ?? []) as unknown as SponsorAdmin[];
}
