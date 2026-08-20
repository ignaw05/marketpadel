import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";
import { nombrePublico, type VendedorPro } from "@/lib/pro-db";
import { type Paleta, formatPrecio, foto } from "@/lib/paletas";

function Mini({ paleta }: { paleta: Paleta }) {
  return (
    <Link
      href={`/paletas/${paleta.id}`}
      className="flex w-[142px] shrink-0 snap-start flex-col overflow-hidden rounded-[12px] transition-shadow hover:shadow-[0_6px_16px_rgba(0,0,0,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", outlineColor: "#057305" }}
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ background: "#F2F1ED", aspectRatio: "4 / 5" }}
      >
        <ImageWithFallback
          src={foto(paleta)}
          alt={`${paleta.marca} ${paleta.modelo}`}
          sizes="142px"
          mini
          className="object-cover"
        />
        {paleta.promocionada && (
          <span
            className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
            style={{ background: "#057305", color: "#FFFFFF", fontWeight: 700 }}
          >
            <Star size={10} aria-hidden /> Destacada
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[13px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {paleta.marca} {paleta.modelo}
        </p>
        <p className="mt-0.5 text-[16px]" style={{ color: "#057305", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
      </div>
    </Link>
  );
}

export function CarteleraVendedor({ vendedor }: { vendedor: VendedorPro }) {
  // El negocio le gana al nombre: si tiene local, es la marca lo que el
  // comprador reconoce. Misma regla que la cinta del feed.
  const nombre = nombrePublico(vendedor);
  const iniciales = vendedor.negocio?.trim()
    ? vendedor.negocio.trim().slice(0, 2).toUpperCase()
    : `${vendedor.nombre[0] ?? ""}${vendedor.apellido[0] ?? ""}`;
  const total = vendedor.paletas.length;
  // Del perfil, no de la primera paleta: donde está el vendedor no es lo mismo
  // que dónde está la paleta que publicó.
  const provincia = vendedor.provincia ?? vendedor.paletas[0]?.provincia;

  return (
    <section
      className="overflow-hidden rounded-[14px]"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5 p-3.5 pb-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] text-white"
          style={{ background: "#057305", fontWeight: 700 }}
          aria-hidden
        >
          {iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-[16px]"
            style={{ color: "#14171A", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {nombre || "Vendedor"}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "rgba(5,115,5,0.10)", color: "#057305", fontWeight: 700 }}
            >
              <BadgeCheck size={11} aria-hidden /> Vendedor Pro
            </span>
            <span className="text-[12px]" style={{ color: "#5B6470" }}>
              {provincia ? `${provincia} · ` : ""}
              {total} {total === 1 ? "publicación" : "publicaciones"}
            </span>
          </div>
        </div>
      </div>

      {/* Scroll manual, sin animación automática: acá hay que poder leer y
          clickear. tabIndex para que se pueda recorrer con el teclado — un
          contenedor scrollable tiene que ser alcanzable sin mouse.
          ponytail: sin botones de flecha. El trackpad, el dedo y las flechas del
          teclado ya lo mueven; si aparecen quejas de mouse sin rueda horizontal,
          ahí entran. */}
      <div
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3.5 pb-3.5 focus-visible:outline-2 focus-visible:-outline-offset-2"
        style={{ outlineColor: "#057305" }}
        tabIndex={0}
        role="region"
        aria-label={`Publicaciones de ${nombre || "el vendedor"}`}
      >
        {vendedor.paletas.map((p) => (
          <Mini key={p.id} paleta={p} />
        ))}
      </div>
    </section>
  );
}
