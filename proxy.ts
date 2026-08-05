import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  const enAuth = request.nextUrl.pathname.startsWith("/auth");

  if (!user && !enAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (user && enAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

// `api` afuera: el webhook de MercadoPago no tiene sesion y este proxy lo mandaria
// a /auth con un 307. Se autentica solo, validando la firma.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|paletas/.*\\.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
