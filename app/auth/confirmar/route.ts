import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Salida del link de confirmacion del mail.
 *
 * Espera `token_hash` + `type`, que es lo que manda la plantilla cuando usa
 * {{ .TokenHash }}. La plantilla por defecto de Supabase usa
 * {{ .ConfirmationURL }}, que devuelve los tokens en el fragmento (#) de la
 * URL: eso no viaja al servidor y esta ruta nunca los veria. Ver README de
 * supabase/templates.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    // redirect() tira NEXT_REDIRECT, va afuera del if de error.
    if (!error) redirect("/?confirmada=1");
  }

  redirect("/auth?error=link");
}
