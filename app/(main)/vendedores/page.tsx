import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { CarteleraVendedor } from "@/components/cartelera-vendedor";
import { listarVendedoresPro } from "@/lib/pro-db";

const TITULO = "Vendedores Pro";
const DESCRIPCION =
  "Los vendedores de paletas de pádel que venden seguido en Paletita, cada uno con todo su catálogo junto.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/vendedores" },
  openGraph: { title: TITULO, description: DESCRIPCION, url: "/vendedores" },
};

export default async function Page() {
  const vendedores = await listarVendedoresPro();

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24, letterSpacing: "-0.025em" }}>
        {TITULO}
      </h1>
      <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470", lineHeight: 1.45 }}>
        Los que venden seguido y sostienen su reputación. Cada uno con todo lo que tiene publicado.
      </p>

      {vendedores.length === 0 ? (
        <div
          className="mt-6 flex flex-col items-center gap-3 rounded-[14px] px-4 py-10 text-center"
          style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
        >
          <Store size={28} style={{ color: "#5B6470" }} aria-hidden />
          <p className="text-[15px]" style={{ color: "#14171A", fontWeight: 600 }}>
            Todavía no hay vendedores Pro
          </p>
          <p className="max-w-[380px] text-[14px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
            Podés ser el primero: el plan te da un distintivo en todas tus paletas y esta cartelera
            para vos solo.
          </p>
          <Link
            href="/pro"
            className="mt-1 flex min-h-[44px] items-center rounded-[14px] px-4 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "#057305", color: "#FFFFFF", fontWeight: 600, outlineColor: "#057305" }}
          >
            Conocer Vendedor Pro
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {vendedores.map((v) => (
            <CarteleraVendedor key={v.id} vendedor={v} />
          ))}
        </div>
      )}
    </div>
  );
}
