import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // Default es 1 MB: una foto de logo sacada directo de la camara del
      // celular lo supera facil, antes de que el action llegue a correr su
      // propia validacion de 500 KB (ver MAX_BYTES_LOGO en
      // app/admin/sponsors/actions.ts). Sin este margen, Next corta la
      // request con un 413 crudo que cae en error.tsx en vez del mensaje
      // "Pesa mas de 500 KB" del formulario.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // Las fotos ya se suben optimizadas: WebP de 1600px mas su variante -mini de
    // 400px (ver achicar/encodar en publish-screen). Volver a pasarlas por el
    // optimizador de Vercel no cambia el peso y consume transformaciones del free
    // tier — una por cada combinacion de origen + ancho + calidad + formato, y el
    // consumo escala con el catalogo. Con unoptimized el consumo es cero y ningun
    // <Image> nuevo lo puede volver a subir sin querer.
    unoptimized: true,
    // Ignorado mientras unoptimized este activo; queda para no romper si algun dia
    // se revierte.
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
