import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createClientePlano } from "@supabase/supabase-js";

/**
 * Cliente sin sesion, para lo que se lee igual estando deslogueado: el feed,
 * las marcas, las ciudades, el detalle de una paleta.
 *
 * PGRST303 ("JWT issued at future") sale de validar el `iat` de un token
 * recien refrescado contra el reloj de PostgREST. Sin token no hay `iat` que
 * validar, asi que el error no puede pasar. Es la unica forma de sacarlo de
 * raiz: conReintento solo espera a que el reloj se acomode, y cuando el
 * desfasaje pasa los ~3,3s que aguanta, el home se cae a error.tsx.
 *
 * Es correcto porque ninguna de esas queries mira `auth.uid()`: la policy
 * paletas_lectura ya deja leer las activas sin sesion y la vista
 * paletas_publicas filtra por estado y vencimiento.
 */
export const clientePublico = () =>
  createClientePlano(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // En el server no hay donde guardar sesion ni a quien refrescarsela.
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

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
