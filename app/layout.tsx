import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Paletita",
  description: "Comprá y vendé paletas de pádel usadas entre jugadores en Argentina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: "#FAFAF8", color: "#14171A" }}>
        {children}
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: "14px" } }} />
      </body>
    </html>
  );
}
