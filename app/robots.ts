import type { MetadataRoute } from "next";

/**
 * Lo privado se bloquea por robots ademas de por auth: si no, Google gasta
 * presupuesto de rastreo en URLs que siempre redirigen al login.
 */
export default function robots(): MetadataRoute.Robots {
  const sitio = process.env.NEXT_PUBLIC_BASE_URL!;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth", "/cuenta", "/editar", "/mis-publicaciones", "/publicar"],
    },
    sitemap: `${sitio}/sitemap.xml`,
  };
}
