import Link from "next/link";
import { Plus, ShoppingBag, Tag } from "lucide-react";

// Unica fuente de las preguntas: el h2 de mas abajo las renderiza y
// app/(main)/page.tsx arma el JSON-LD FAQPage con este mismo array, asi el
// texto que ve el usuario y el que lee Google nunca se desincronizan.
export const FAQ = [
  {
    pregunta: "¿Es gratis publicar una paleta?",
    respuesta:
      "Sí. Publicar no cuesta nada. Solo pagás si elegís destacar tu paleta para que aparezca primero en los resultados.",
  },
  {
    pregunta: "¿Cómo sé que la paleta está en el estado que dice el aviso?",
    respuesta:
      "Cada aviso tiene fotos reales de la paleta y su estado declarado por quien la vende. Antes de coordinar la compra, pedile fotos o video del desgaste puntual por WhatsApp.",
  },
  {
    pregunta: "¿Cómo se coordina el pago y la entrega?",
    respuesta:
      "Paletita conecta a comprador y vendedor por WhatsApp; el pago y la entrega los arreglan entre ustedes, como en cualquier operación entre particulares. Recomendamos encontrarse en persona para pagar y revisar la paleta.",
  },
  {
    pregunta: "¿Paletita cobra comisión por venta?",
    respuesta:
      "No. A diferencia de MercadoLibre, no hay comisión: lo que acordás con el comprador es lo que te queda.",
  },
  {
    pregunta: "¿Qué pasa si no encuentro la paleta que busco?",
    respuesta:
      "Publicaciones nuevas entran todos los días. Guardá tu búsqueda con los filtros de marca y provincia, y volvé a mirar en unos días.",
  },
] as const;

export function SobrePaletita() {
  const h2 = {
    color: "#14171A",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  } as const;

  return (
    <div
      className="mt-12 flex flex-col gap-10 pt-10"
      style={{ borderTop: "1px solid #E6E4DF" }}
    >
      <section aria-labelledby="sobre-paletita">
        <h2 id="sobre-paletita" className="text-[19px] md:text-[22px]" style={h2}>
          Sobre Paletita
        </h2>
        <p
          className="mt-2 max-w-[70ch] text-[14px] leading-relaxed"
          style={{ color: "#5B6470" }}
        >
          Paletita es el marketplace dedicado a la compraventa de paletas de
          pádel usadas en Argentina. Nació para reemplazar los grupos de
          Facebook y las cadenas de WhatsApp donde se pierden los avisos: acá
          cada paleta tiene sus fotos, su estado real y su precio en un solo
          lugar, ordenados por marca y provincia.
        </p>
        <p
          className="mt-2 max-w-[70ch] text-[14px] leading-relaxed"
          style={{ color: "#5B6470" }}
        >
          A diferencia de MercadoLibre, publicar es gratis y no se cobra
          comisión por venta: es 100% pádel, entre jugadores.
        </p>
      </section>

      <section
        aria-labelledby="como-funciona"
        className="rounded-[14px] p-6"
        style={{ background: "#F2F1ED" }}
      >
        <h2 id="como-funciona" className="text-[19px] md:text-[22px]" style={h2}>
          Cómo funciona
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3
              className="flex items-center gap-2 text-[15px]"
              style={{ color: "#14171A", fontWeight: 700 }}
            >
              <ShoppingBag size={18} style={{ color: "#057305" }} aria-hidden />
              Comprar
            </h3>
            <ol
              className="mt-2 flex flex-col gap-2 text-[14px] leading-relaxed"
              style={{ color: "#5B6470" }}
            >
              <li>1. Filtrá por marca, provincia o precio.</li>
              <li>2. Mirá las fotos y el estado real de cada paleta.</li>
              <li>3. Escribile al vendedor por WhatsApp y coordiná.</li>
            </ol>
          </div>
          <div>
            <h3
              className="flex items-center gap-2 text-[15px]"
              style={{ color: "#14171A", fontWeight: 700 }}
            >
              <Tag size={18} style={{ color: "#057305" }} aria-hidden />
              Vender
            </h3>
            <ol
              className="mt-2 flex flex-col gap-2 text-[14px] leading-relaxed"
              style={{ color: "#5B6470" }}
            >
              <li>1. Sacale fotos a tu paleta y cargá el aviso, es gratis.</li>
              <li>2. Contá el estado real: uso, golpes, cara y marco.</li>
              <li>3. Respondé las consultas que te lleguen por WhatsApp.</li>
            </ol>
          </div>
        </div>

        {/* A /publicar y no a /auth: sin sesion el proxy lo manda al login con
            el next puesto, y con sesion cae donde queria ir. */}
        <Link
          href="/publicar"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
        >
          <Plus size={16} aria-hidden /> Publicar una paleta
        </Link>
      </section>

      <section aria-labelledby="preguntas-frecuentes">
        <h2 id="preguntas-frecuentes" className="text-[19px] md:text-[22px]" style={h2}>
          Preguntas frecuentes
        </h2>
        <div className="mt-4 flex flex-col">
          {FAQ.map(({ pregunta, respuesta }) => (
            <details
              key={pregunta}
              className="group border-b py-3"
              style={{ borderColor: "#E6E4DF" }}
            >
              <summary
                className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: "#14171A", fontWeight: 600, outlineColor: "#057305" }}
              >
                {pregunta}
                <span
                  className="shrink-0 text-[18px] leading-none transition-transform group-open:rotate-45"
                  style={{ color: "#057305" }}
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#5B6470" }}>
                {respuesta}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
