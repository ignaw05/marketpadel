import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const TITULO = "Paletita — Paletas de pádel usadas en Argentina";
const DESCRIPCION =
  "Paletita es el mercado de paletas de pádel usadas en Argentina. Comprá y vendé paletas Bullpadel, Adidas, Head, Nox, Siux y más entre jugadores, con contacto directo por WhatsApp.";

export const metadata: Metadata = {
  // Sin metadataBase, todo og:image y canonical relativo sale como ruta suelta
  // y Google los descarta.
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!),
  title: { default: TITULO, template: "%s | Paletita" },
  description: DESCRIPCION,
  applicationName: "Paletita",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Paletita",
    url: "/",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: "#FAFAF8", color: "#14171A" }}>
        {children}
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: "14px" } }} />
        <Analytics />
        {/* Google Analytics. next/script lo carga despues de hidratar, no bloquea el LCP. */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-SWDVMDHFYH" />
        <Script id="gtag">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-SWDVMDHFYH');
        `}</Script>
      </body>
    </html>
  );
}
