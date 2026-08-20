// Que se puede ver sin sesion. Con la campaña de ads el gate esta full: toda la
// app pide login. AUTH_OBLIGATORIO=false lo vuelve al modo normal sin deploy.
export const AUTH_OBLIGATORIO = process.env.AUTH_OBLIGATORIO !== "false";

/** Siempre piden sesion, tambien con el gate apagado. */
const PRIVADAS = ["/publicar", "/mis-publicaciones", "/editar"];

/**
 * Nunca piden sesion, tambien con el gate prendido: login, legales y SEO.
 *
 * `/pro` entra porque es la landing del plan y es a donde apuntan los ads: si
 * pidiera login, el que viene de un anuncio se choca con un formulario antes de
 * enterarse de que le estamos vendiendo. `/vendedores` NO entra: es catalogo,
 * y sigue el mismo gate que el feed.
 */
const PUBLICAS = [
  "/auth",
  "/terminos",
  "/pro",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
];

export function requiereSesion(pathname: string, obligatorio = AUTH_OBLIGATORIO): boolean {
  if (!obligatorio) return PRIVADAS.some((p) => pathname.startsWith(p));
  return !PUBLICAS.some((p) => pathname.startsWith(p));
}
