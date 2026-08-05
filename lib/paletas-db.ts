// Solo servidor: usa next/headers via lib/supabase/server.
import { createClient } from "@/lib/supabase/server";
import { PRECIOS, ESTADOS, type Paleta, type Vendedor, type FiltrosFeed } from "@/lib/paletas";
import { limpiarBusqueda } from "@/lib/validar";

const VISTA =
  "id, vendedor_id, marca, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, promocionada";

export async function listarPaletas(f: FiltrosFeed): Promise<Paleta[]> {
  const supabase = await createClient();

  let query = supabase
    .from("paletas_publicas")
    .select(VISTA)
    .order("promocionada", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60); // ponytail: sin paginar hasta que el feed la pida

  const busqueda = f.q ? limpiarBusqueda(f.q) : "";
  if (busqueda) {
    query = query.or(`modelo.ilike.%${busqueda}%,marca.ilike.%${busqueda}%`);
  }
  if (f.marca) query = query.eq("marca", f.marca);
  if (f.forma) query = query.eq("forma", f.forma);
  if (f.ciudad) query = query.eq("ciudad", f.ciudad);

  const rango = PRECIOS.find((p) => p.label === f.precio);
  if (rango) {
    query = query.gte("precio", rango.min);
    if (rango.max !== null) query = query.lte("precio", rango.max);
  }

  const minEstado = ESTADOS.find((e) => e.label === f.estado);
  if (minEstado) query = query.gte("estado", minEstado.min);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Paleta[];
}

export async function obtenerPaleta(
  id: string,
): Promise<{ paleta: Paleta; vendedor: Vendedor } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("paletas_publicas")
    .select(`${VISTA}, perfiles!vendedor_id (nombre, apellido, whatsapp, created_at)`)
    .eq("id", id)
    .maybeSingle();

  // 22P02: el id de la URL no es un uuid valido. Es un 404, no un error.
  if (error && error.code !== "22P02") throw error;
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

export async function listarMisPaletas(): Promise<Paleta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("paletas")
    .select(
      "id, vendedor_id, modelo, forma, anio, estado, precio, provincia, ciudad, descripcion, fotos, visitas, estado_publicacion, marcas (nombre)",
    )
    .eq("vendedor_id", user.id)
    .neq("estado_publicacion", "eliminada")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(({ marcas, ...p }) => ({
    ...p,
    marca: (marcas as unknown as { nombre: string } | null)?.nombre ?? "",
  })) as unknown as Paleta[];
}

export async function listarMarcas(): Promise<{ id: number; nombre: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marcas")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");

  if (error) throw error;
  return data ?? [];
}

/** Ciudades con al menos una publicacion activa, para el filtro de ubicacion. */
export async function listarCiudades(): Promise<string[]> {
  const supabase = await createClient();
  // ponytail: distinct en JS sobre el feed. Si crece, una vista materializada.
  const { data, error } = await supabase
    .from("paletas_publicas")
    .select("ciudad")
    .limit(500);

  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.ciudad))].sort((a, b) =>
    a.localeCompare(b, "es-AR"),
  );
}
