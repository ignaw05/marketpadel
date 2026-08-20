import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CarteleraVendedor } from "./cartelera-vendedor";
import { type VendedorPro } from "@/lib/pro-db";

/**
 * El adelanto de /vendedores en la portada. Solo se monta en la portada limpia:
 * con un filtro puesto, el visitante esta buscando algo concreto y meterle
 * carteleras arriba lo empuja el feed fuera de la pantalla.
 */
export function CartelerasHome({ vendedores }: { vendedores: VendedorPro[] }) {
  if (vendedores.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          className="text-[17px]"
          style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Vendedores Pro
        </h2>
        <Link
          href="/vendedores"
          className="flex min-h-[44px] items-center gap-0.5 text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#057305", fontWeight: 600, outlineColor: "#057305" }}
        >
          Ver todos <ChevronRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {vendedores.map((v) => (
          <CarteleraVendedor key={v.id} vendedor={v} />
        ))}
      </div>
    </section>
  );
}
