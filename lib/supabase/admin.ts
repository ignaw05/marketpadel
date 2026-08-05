import { createClient } from "@supabase/supabase-js";

/**
 * Bypasea RLS. Unico lugar del codigo que usa la service role key: el webhook de
 * MercadoPago no tiene sesion de usuario y tiene que escribir en pagos.
 */
export const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
