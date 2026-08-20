import type { Metadata } from "next";
import { HomeScreen } from "@/components/screens/home-screen";
import { CartelerasHome } from "@/components/carteleras-home";
import { FAQ } from "@/components/sobre-paletita";
import { listarPaletas, listarMarcas } from "@/lib/paletas-db";
import { listarVendedoresPro } from "@/lib/pro-db";
import {
  CLAVES_FILTRO,
  canonicaFeed,
  paginaActual,
  tituloFeed,
  type FiltrosFeed,
} from "@/lib/paletas";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FiltrosFeed>;
}): Promise<Metadata> {
  const filtros = await searchParams;
  const { path, indexable } = canonicaFeed(filtros);
  const titulo = tituloFeed(filtros);

  // Solo la inicial en minuscula: un toLowerCase() entero se come Bullpadel,
  // Córdoba y Argentina, que son justo las palabras que se buscan.
  // Corta a ~140: mas largo que eso Google lo trunca con puntos suspensivos.
  const descripcion = `Comprá y vendé ${titulo[0].toLowerCase()}${titulo.slice(
    1,
  )}. Publicar es gratis y hablás directo con el vendedor por WhatsApp.`;

  return {
    // El template del layout ya agrega "| Paletita": ponerlo aca lo duplica.
    title: titulo,
    description: descripcion,
    alternates: { canonical: path },
    // follow: las fichas linkeadas desde una faceta que no se indexa se
    // rastrean igual, que es todo lo que se le pide a esas URLs.
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    // openGraph pisa entero al del layout, no lo completa: lo que no se
    // repita aca se pierde, imagen incluida.
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: "Paletita",
      url: path,
      title: `${titulo} | Paletita`,
      description: descripcion,
      // app/opengraph-image.tsx solo se hereda solo cuando la pagina no
      // declara openGraph: como esta lo declara, hay que nombrarla.
      images: ["/opengraph-image"],
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltrosFeed>;
}) {
  const filtros = await searchParams;
  const pagina = paginaActual(filtros.pagina);
  const buscando = CLAVES_FILTRO.some((k) => filtros[k]) || pagina > 1;

  const [{ paletas, hayMas }, marcas, vendedoresPro] = await Promise.all([
    listarPaletas(filtros),
    listarMarcas(),
    // Solo en la portada limpia: con un filtro puesto el visitante busca algo
    // concreto y las carteleras le empujarian el feed fuera de la pantalla.
    buscando ? Promise.resolve([]) : listarVendedoresPro(2),
  ]);

  const sitio = process.env.NEXT_PUBLIC_BASE_URL!;
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Paletita",
    alternateName: "Paletita — paletas de pádel usadas",
    url: sitio,
    inLanguage: "es-AR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${sitio}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    // La descripcion y el areaServed son lo que citan los motores de IA cuando
    // les preguntan donde comprar una paleta usada en Argentina.
    publisher: {
      "@type": "Organization",
      name: "Paletita",
      url: sitio,
      logo: `${sitio}/logo.png`,
      description:
        "Marketplace argentino de paletas de pádel usadas. Publicar es gratis, no hay comisión por venta y el contacto entre comprador y vendedor es directo por WhatsApp.",
      areaServed: { "@type": "Country", name: "Argentina" },
    },
  };

  // Solo en la portada limpia: repetido en cada faceta serian las mismas
  // preguntas en /?marca=Nox y en /?provincia=Córdoba, contenido duplicado.
  const faqLd = !buscando && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ pregunta, respuesta }) => ({
      "@type": "Question",
      name: pregunta,
      acceptedAnswer: { "@type": "Answer", text: respuesta },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <HomeScreen
        paletas={paletas}
        marcas={marcas.map((m) => m.nombre)}
        filtros={filtros}
        pagina={pagina}
        hayMas={hayMas}
        carteleras={<CartelerasHome vendedores={vendedoresPro} />}
      />
    </>
  );
}
