import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { destinoSeguro } from "@/lib/validar";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca el token vencido y lo escribe en la respuesta. No sacar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const PRIVADAS = ["/publicar", "/mis-publicaciones", "/editar"];
  const { pathname, search } = request.nextUrl;

  if (!user && PRIVADAS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // /auth/nueva queda afuera: al reset se llega justo con la sesion que abrio el
  // link del mail, y si no la salteamos el proxy lo rebota antes de elegir la clave.
  if (user && pathname.startsWith("/auth") && pathname !== "/auth/nueva") {
    const url = request.nextUrl.clone();
    url.pathname = destinoSeguro(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

// `api` afuera: el webhook de MercadoPago no tiene sesion y este proxy lo mandaria
// a /auth con un 307. Se autentica solo, validando la firma.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|paletas/.*\\.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
