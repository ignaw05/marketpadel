// Solo servidor: usa next/headers via lib/supabase/server.
import { createClient } from "@/lib/supabase/server";
import {
  ESTADOS,
  topePrecio,
  promoVigente,
  paginaActual,
  POR_PAGINA,
  type Paleta,
  type Vendedor,
  type FiltrosFeed,
} from "@/lib/paletas";
import { limpiarBusqueda } from "@/lib/validar";
import { conReintento } from "@/lib/reintentar";

const VISTA =
  "id, vendedor_id, marca, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, promocionada";

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
  const supabase = await createClient();
  const busqueda = f.q ? limpiarBusqueda(f.q) : "";
  const tope = topePrecio(f.precioMax);
  const minEstado = ESTADOS.find((e) => e.label === f.estado);
  const desde = (paginaActual(f.pagina) - 1) * POR_PAGINA;

  const data = await conReintento(() => {
    let query = supabase
      .from("paletas_publicas")
      .select(VISTA)
      .order("promocionada", { ascending: false })
      .order("created_at", { ascending: false })
      // range es inclusivo de los dos lados: esto pide POR_PAGINA + 1.
      .range(desde, desde + POR_PAGINA);

    if (busqueda) {
      query = query.or(`modelo.ilike.%${busqueda}%,marca.ilike.%${busqueda}%`);
    }
    if (f.marca) query = query.eq("marca", f.marca);
    if (f.forma) query = query.eq("forma", f.forma);
    if (f.provincia) query = query.eq("provincia", f.provincia);
    if (f.ciudad) query = query.eq("ciudad", f.ciudad);

    if (tope !== null) query = query.lte("precio", tope);
    if (minEstado) query = query.gte("estado", minEstado.min);

    return query;
  });

  const filas = (data ?? []) as unknown as Paleta[];
  return { paletas: filas.slice(0, POR_PAGINA), hayMas: filas.length > POR_PAGINA };
}

export async function obtenerPaleta(
  id: string,
): Promise<{ paleta: Paleta; vendedor: Vendedor } | null> {
  const supabase = await createClient();

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
        "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, estado_publicacion, vence_at, marcas (nombre)",
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
        "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, estado_publicacion, vence_at, marcas (nombre), promociones (hasta)",
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

export async function listarMarcas(): Promise<{ id: number; nombre: string }[]> {
  const supabase = await createClient();

  const data = await conReintento(() =>
    supabase.from("marcas").select("id, nombre").eq("activa", true).order("nombre"),
  );

  return data ?? [];
}

/** Ciudades con al menos una publicacion activa, para el filtro de ubicacion. */
export async function listarCiudades(): Promise<string[]> {
  const supabase = await createClient();

  // ponytail: distinct en JS sobre el feed. Si crece, una vista materializada.
  const data = await conReintento(() =>
    supabase.from("paletas_publicas").select("ciudad").limit(500),
  );

  return [...new Set((data ?? []).map((r) => r.ciudad))].sort((a, b) =>
    a.localeCompare(b, "es-AR"),
  );
}
