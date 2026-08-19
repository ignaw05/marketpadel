// Solo servidor: usa next/headers via lib/supabase/server.
import { cache } from "react";
import { createClient, clientePublico } from "@/lib/supabase/server";
import {
  ESTADOS,
  PERMUTA,
  topePrecio,
  promoVigente,
  ordenActual,
  paginaActual,
  POR_PAGINA,
  type Paleta,
  type Vendedor,
  type Venta,
  type FiltrosFeed,
} from "@/lib/paletas";
import { limpiarBusqueda } from "@/lib/validar";
import { conReintento } from "@/lib/reintentar";

const VISTA =
  "id, vendedor_id, marca, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, acepta_permuta, promocionada";

/**
 * Una pagina del feed. Los filtros se aplican en la query, o sea contra el
 * catalogo entero: paginar no los limita a lo que se ve en pantalla.
 *
 * `hayMas` sale de pedir un elemento de mas en vez de un count(*): saber si
 * existe la pagina siguiente es todo lo que necesita la navegacion, y un
 * count exacto sobre el catalogo entero cuesta un scan completo por request.
 * ponytail: si algun dia hay que mostrar "pagina 3 de 47", ahi entra el count.
 */
export async function listarPaletas(
  f: FiltrosFeed,
): Promise<{ paletas: Paleta[]; hayMas: boolean }> {
  const supabase = clientePublico();
  const busqueda = f.q ? limpiarBusqueda(f.q) : "";
  const tope = topePrecio(f.precioMax);
  const minEstado = ESTADOS.find((e) => e.label === f.estado);
  const orden = ordenActual(f.orden);
  const desde = (paginaActual(f.pagina) - 1) * POR_PAGINA;

  const data = await conReintento(() => {
    let query = supabase.from("paletas_publicas").select(VISTA);

    query = query
      // Las promocionadas van primero SIEMPRE, en todos los ordenes y con
      // cualquier filtro puesto: eso es lo que se paga. El orden elegido y los
      // filtros mandan dentro de cada bloque, no sobre el.
      //
      // El costo asumido: en "menor precio" las primeras que se ven no son las
      // mas baratas del catalogo, sino las mas baratas entre las promocionadas.
      .order("promocionada", { ascending: false })
      .order(orden.columna, { ascending: orden.asc })
      // Desempate estable: sin esto, dos paletas al mismo precio pueden
      // repetirse o perderse al pasar de pagina.
      .order("id")
      // range es inclusivo de los dos lados: esto pide POR_PAGINA + 1.
      .range(desde, desde + POR_PAGINA);

    if (busqueda) {
      query = query.or(`modelo.ilike.%${busqueda}%,marca.ilike.%${busqueda}%`);
    }
    if (f.marca) query = query.eq("marca", f.marca);
    if (f.forma) query = query.eq("forma", f.forma);
    if (f.provincia) query = query.eq("provincia", f.provincia);
    // Comparacion contra el catalogo, no contra el valor de la URL: cualquier
    // otra cosa en ?permuta= no filtra nada en vez de romper la query.
    if (f.permuta === PERMUTA[0]) query = query.eq("acepta_permuta", true);
    else if (f.permuta === PERMUTA[1]) query = query.eq("acepta_permuta", false);

    if (tope !== null) query = query.lte("precio", tope);
    if (minEstado) query = query.gte("estado", minEstado.min);

    return query;
  });

  const filas = (data ?? []) as unknown as Paleta[];
  return { paletas: filas.slice(0, POR_PAGINA), hayMas: filas.length > POR_PAGINA };
}

/**
 * generateMetadata y el propio Server Component piden la misma paleta en el
 * mismo request: sin cache() eso son dos viajes a la base por cada detalle.
 */
export const obtenerPaleta = cache(obtenerPaletaDb);

async function obtenerPaletaDb(
  id: string,
): Promise<{ paleta: Paleta; vendedor: Vendedor } | null> {
  const supabase = clientePublico();

  const data = await conReintento(async () => {
    const r = await supabase
      .from("paletas_publicas")
      .select(`${VISTA}, perfiles!vendedor_id (nombre, apellido, whatsapp, created_at)`)
      .eq("id", id)
      .maybeSingle();

    // 22P02: el id de la URL no es un uuid valido. Es un 404, no un error.
    if (r.error?.code === "22P02") return { data: null, error: null };
    return r;
  });

  if (!data) return null;

  const { perfiles, ...paleta } = data as unknown as Paleta & {
    perfiles: {
      nombre: string;
      apellido: string;
      whatsapp: string | null;
      created_at: string;
    } | null;
  };

  return {
    paleta,
    vendedor: {
      nombre: perfiles?.nombre || "Vendedor",
      apellido: perfiles?.apellido || "",
      whatsapp: perfiles?.whatsapp ?? null,
      miembroDesde: new Date(perfiles?.created_at ?? Date.now()).getFullYear(),
    },
  };
}

export async function obtenerMiPaleta(id: string): Promise<Paleta | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await conReintento(async () => {
    const r = await supabase
      .from("paletas")
      .select(
        "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, acepta_permuta, estado_publicacion, vence_at, marcas (nombre)",
      )
      .eq("id", id)
      .eq("vendedor_id", user.id)
      .maybeSingle();

    // 22P02: el id de la URL no es un uuid valido. Es un 404, no un error.
    if (r.error?.code === "22P02") return { data: null, error: null };
    return r;
  });

  if (!data) return null;

  const { marcas, ...paleta } = data as unknown as Paleta & {
    marcas: { nombre: string } | null;
  };

  return { ...paleta, marca: marcas?.nombre ?? "" };
}

export async function listarMisPaletas(): Promise<Paleta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const data = await conReintento(() =>
    supabase
      .from("paletas")
      .select(
        "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, acepta_permuta, estado_publicacion, vence_at, marcas (nombre), promociones (hasta)",
      )
      .eq("vendedor_id", user.id)
      .neq("estado_publicacion", "eliminada")
      .order("created_at", { ascending: false }),
  );

  // La tabla no tiene `promocionada` como la vista: se deriva de las promociones.
  return (data ?? []).map(({ marcas, promociones, ...p }) => ({
    ...p,
    marca: (marcas as unknown as { nombre: string } | null)?.nombre ?? "",
    promocionada: promoVigente(promociones as unknown as { hasta: string }[]),
  })) as unknown as Paleta[];
}

/**
 * Lo que vendio el usuario logueado, mas reciente primero. No hay columna de
 * fecha de venta: `updated_at` es lo mas cercano, y cambiarEstado() es la
 * unica escritura que toca una vendida.
 */
export async function listarMisVentas(): Promise<Venta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const data = await conReintento(() =>
    supabase
      .from("paletas")
      .select("id, modelo, estado, precio, fotos, updated_at, marcas (nombre)")
      .eq("vendedor_id", user.id)
      .eq("estado_publicacion", "vendida")
      .order("updated_at", { ascending: false }),
  );

  return (data ?? []).map(({ marcas, updated_at, ...v }) => ({
    ...v,
    marca: (marcas as unknown as { nombre: string } | null)?.nombre ?? "",
    vendida_at: updated_at,
  })) as unknown as Venta[];
}

/**
 * Lo vendido en toda la app, mas reciente primero. Va contra ventas_publicas
 * (0010): esa vista es anonima a proposito, sin vendedor_id ni descripcion, asi
 * que ninguna venta ajena se puede rastrear hasta la persona que la hizo.
 *
 * ponytail: tope fijo en vez de paginado. Si el historial global crece lo
 * suficiente como para que 60 se sientan poco, ahi entra la paginacion.
 */
export async function listarVentasGlobales(): Promise<Venta[]> {
  const supabase = clientePublico();

  const data = await conReintento(() =>
    supabase
      .from("ventas_publicas")
      .select("id, marca, modelo, estado, precio, fotos, vendida_at")
      .order("vendida_at", { ascending: false })
      .limit(60),
  );

  return (data ?? []) as unknown as Venta[];
}

export async function listarMarcas(): Promise<{ id: number; nombre: string }[]> {
  const supabase = clientePublico();

  const data = await conReintento(() =>
    supabase.from("marcas").select("id, nombre").eq("activa", true).order("nombre"),
  );

  return data ?? [];
}

/** Solo para el sitemap: id y fecha de cada publicacion viva. */
export async function listarIdsPublicos(): Promise<{ id: string; created_at: string }[]> {
  const supabase = clientePublico();

  // ponytail: un sitemap es de hasta 50.000 URLs. Pasado eso, hay que partirlo
  // en varios con generateSitemaps().
  const data = await conReintento(() =>
    supabase.from("paletas_publicas").select("id, created_at").limit(5000),
  );

  return data ?? [];
}
