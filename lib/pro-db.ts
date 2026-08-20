// Solo servidor: usa next/headers via lib/supabase/server.
import { createClient, clientePublico } from "@/lib/supabase/server";
import { conReintento } from "@/lib/reintentar";
import { type Paleta } from "@/lib/paletas";

export type VendedorPro = {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  /** Nombre del local. Si está, es lo que ve el comprador en vez del nombre. */
  negocio: string | null;
  provincia: string | null;
  paletas: Paleta[];
};

/** Con quién cree el comprador que habla. Misma regla que la vista para la cinta. */
export const nombrePublico = (v: {
  negocio: string | null;
  nombre: string;
  apellido: string;
}): string => v.negocio?.trim() || `${v.nombre} ${v.apellido}`.trim() || "Vendedor";

/** Lo que muestra cada cartelera. Menos columnas que el feed: no hay descripcion ni ciudad. */
const CARTELERA =
  "id, vendedor_id, marca, modelo, forma, anio, estado, precio, provincia, ciudad, fotos, promocionada";

/**
 * Las carteleras de /vendedores. Dos queries, no una por vendedor: primero la
 * lista de perfiles con plan vigente, despues todas sus paletas de una, y el
 * agrupado se hace aca.
 *
 * `tope` acota cuantos vendedores entran (la home muestra dos). El scroll
 * horizontal de cada fila no tiene tope: es lo que se paga.
 *
 * ponytail: sin paginado. Cuando haya tantos Pro como para que /vendedores pese,
 * ahi entra, y probablemente con el mismo `hayMas` del feed.
 */
export async function listarVendedoresPro(tope?: number): Promise<VendedorPro[]> {
  const supabase = clientePublico();

  const perfiles = await conReintento(() => {
    const q = supabase
      .from("vendedores_pro")
      // Antiguedad en Paletita. La fecha de alta de la suscripcion seria lo
      // obvio, pero `suscripciones` tiene RLS de "solo las propias" y un
      // visitante anonimo no veria ninguna.
      .select("id, nombre, apellido, avatar_url, negocio, provincia")
      .order("created_at")
      .order("id");

    return tope ? q.limit(tope) : q;
  });

  if (!perfiles?.length) return [];

  const ids = perfiles.map((p) => p.id as string);

  const paletas = await conReintento(() =>
    supabase
      .from("paletas_publicas")
      .select(CARTELERA)
      .in("vendedor_id", ids)
      // Las promocionadas primero dentro de la fila de cada vendedor, igual que
      // en el feed: el credito vale en las dos superficies.
      .order("promocionada", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id"),
  );

  const porVendedor = new Map<string, Paleta[]>();
  for (const p of (paletas ?? []) as unknown as Paleta[]) {
    const fila = porVendedor.get(p.vendedor_id);
    if (fila) fila.push(p);
    else porVendedor.set(p.vendedor_id, [p]);
  }

  // Un Pro sin publicaciones activas no tiene cartelera que mostrar: se saltea
  // en vez de dejar una fila vacia.
  return perfiles
    .map((p) => ({
      id: p.id as string,
      nombre: (p.nombre as string) || "Vendedor",
      apellido: (p.apellido as string) || "",
      avatar_url: (p.avatar_url as string | null) ?? null,
      negocio: (p.negocio as string | null) ?? null,
      provincia: (p.provincia as string | null) ?? null,
      paletas: porVendedor.get(p.id as string) ?? [],
    }))
    .filter((v) => v.paletas.length > 0);
}

export type MiPlan = {
  /** Vencimiento del periodo mas lejano, o null si nunca tuvo plan. */
  hasta: string | null;
  /** Id de la suscripcion vigente HOY. Null si no hay ninguna corriendo. */
  suscripcionId: string | null;
  usados: number;
};

/**
 * El plan del usuario logueado. Las policies `suscripciones_propias` y
 * `promociones_lectura` de 0001 ya alcanzan: no hace falta service role.
 */
export async function miPlan(): Promise<MiPlan> {
  const vacio: MiPlan = { hasta: null, suscripcionId: null, usados: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return vacio;

  const ahora = new Date().toISOString();

  const suscripciones = await conReintento(() =>
    supabase
      .from("suscripciones")
      .select("id, desde, hasta")
      .eq("perfil_id", user.id)
      .order("hasta", { ascending: false }),
  );

  if (!suscripciones?.length) return vacio;

  // La vigente es la que arranco y todavia no termino. Puede no ser la primera:
  // renovar antes de vencer deja una fila futura con `hasta` mas lejano.
  const vigente = suscripciones.find((s) => s.desde <= ahora && ahora < s.hasta);
  const hasta = suscripciones[0].hasta as string;

  if (!vigente) return { hasta, suscripcionId: null, usados: 0 };

  const { count } = await supabase
    .from("promociones")
    .select("id", { count: "exact", head: true })
    .eq("suscripcion_id", vigente.id);

  return { hasta, suscripcionId: vigente.id as string, usados: count ?? 0 };
}
