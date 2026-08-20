import type { MetadataRoute } from "next";
import { listarIdsPublicos } from "@/lib/paletas-db";

// El catalogo cambia todo el dia pero Google no lo relee mas seguido que esto.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitio = process.env.NEXT_PUBLIC_BASE_URL!;
  const paletas = await listarIdsPublicos();

  return [
    { url: sitio, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${sitio}/pro`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${sitio}/vendedores`, changeFrequency: "daily", priority: 0.5 },
    { url: `${sitio}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    ...paletas.map((p) => ({
      url: `${sitio}/paletas/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
