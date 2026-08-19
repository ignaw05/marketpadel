// Solo servidor: usa next/headers via lib/supabase/server.
import { clientePublico } from "@/lib/supabase/server";
import { conReintento } from "@/lib/reintentar";

export type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string;
  link: string | null;
};

/**
 * Los sponsors de la tira, en el orden en que se muestran.
 *
 * No filtra por `activo`: la policy de RLS de la tabla ya devuelve solo los
 * activos. Repetirlo aca seria una segunda fuente de verdad para la misma
 * regla, y la que manda es la de la base.
 */
export async function listarSponsors(): Promise<Sponsor[]> {
  const supabase = clientePublico();

  const data = await conReintento(() =>
    supabase
      .from("sponsors")
      .select("id, nombre, logo_url, link")
      // Mismo orden que el indice parcial sponsors_visibles_idx. created_at
      // desempata: sin el, dos sponsors con el mismo `orden` se intercambian
      // de lugar entre requests y la tira "parpadea" al navegar.
      .order("orden")
      .order("created_at"),
  );

  return (data ?? []) as unknown as Sponsor[];
}
