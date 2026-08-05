import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // ponytail: en un Server Component las cookies son de solo lectura.
            // El middleware ya refresca la sesión, así que se puede ignorar.
          }
        },
      },
    },
  );
}
