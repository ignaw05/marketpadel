"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Suma una visita al montar. Va en el cliente a proposito: en el server se
 * contaria tambien el prefetch del Link, o sea pasar el mouse por la card.
 * ponytail: sin dedupe por usuario. Si hace falta, una tabla de visitas.
 */
export function ContarVisita({ id }: { id: string }) {
  useEffect(() => {
    createClient()
      .rpc("incrementar_visitas", { p_paleta_id: id })
      .then(() => {});
  }, [id]);

  return null;
}
