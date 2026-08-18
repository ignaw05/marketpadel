import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/detail-view";
import { ContarVisita } from "@/components/contar-visita";
import { obtenerPaleta } from "@/lib/paletas-db";
import { createClient } from "@/lib/supabase/server";
import { estadoLabel, formatPrecio, type Paleta } from "@/lib/paletas";

const titulo = (p: Paleta) =>
  `Paleta ${p.marca} ${p.modelo} usada en ${p.ciudad} — ${formatPrecio(p.precio)}`;

const descripcion = (p: Paleta) =>
  `Paleta ${p.marca} ${p.modelo} usada en venta en ${p.ciudad}, ${p.provincia}. Forma ${p.forma}, año ${p.anio}, estado ${p.estado}/10 (${estadoLabel(
    p.estado,
  ).toLowerCase()}). ${formatPrecio(p.precio)}. Contactá al vendedor por WhatsApp en Paletita.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resultado = await obtenerPaleta(id);

  // Sin publicacion la pagina es un 404: que no quede indexable ni compartible.
  if (!resultado)
    return { title: "Paleta no encontrada", robots: { index: false } };

  const { paleta } = resultado;
  const t = titulo(paleta);
  const d = descripcion(paleta);

  return {
    title: t,
    description: d,
    alternates: { canonical: `/paletas/${paleta.id}` },
    // openGraph pisa entero al del layout, no lo completa.
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: "Paletita",
      title: t,
      description: d,
      url: `/paletas/${paleta.id}`,
      images: paleta.fotos.length ? paleta.fotos.slice(0, 1) : undefined,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [resultado, { data }] = await Promise.all([
    obtenerPaleta(id),
    supabase.auth.getUser(),
  ]);

  if (!resultado) notFound();

  const { paleta } = resultado;

  // Product + Offer: es lo que hace que la publicacion pueda salir en Google
  // con precio y estado, no como un resultado de texto pelado.
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${paleta.marca} ${paleta.modelo}`,
    description: paleta.descripcion,
    image: paleta.fotos,
    sku: paleta.id,
    brand: { "@type": "Brand", name: paleta.marca },
    category: "Paletas de pádel",
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/paletas/${paleta.id}`,
      price: paleta.precio,
      priceCurrency: "ARS",
      itemCondition: "https://schema.org/UsedCondition",
      availability: "https://schema.org/InStock",
      areaServed: { "@type": "Country", name: "Argentina" },
      seller: {
        "@type": "Person",
        name: `${resultado.vendedor.nombre} ${resultado.vendedor.apellido}`.trim(),
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <ContarVisita id={id} />
      <DetailView
        paleta={paleta}
        vendedor={resultado.vendedor}
        esDueno={data.user?.id === paleta.vendedor_id}
        logueado={!!data.user}
      />
    </>
  );
}
