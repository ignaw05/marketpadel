import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
  description:
    "Paletita conecta compradores y vendedores de paletas de pádel. No participa de las ventas ni es responsable por ellas.",
};

const secciones = [
  {
    titulo: "Qué es Paletita",
    parrafos: [
      "Paletita es un tablón de anuncios: conecta a personas que quieren vender una paleta de pádel con personas que quieren comprarla. Nada más que eso.",
      "No compramos, no vendemos, no intermediamos y no tomamos parte en ninguna operación. Las publicaciones las escriben los usuarios y son responsabilidad de quien las publica.",
    ],
  },
  {
    titulo: "Responsabilidad por las ventas",
    parrafos: [
      "Paletita no es parte de la compraventa entre usuarios y no es responsable por ella. Toda la operación (precio, pago, entrega, envío, garantía, devoluciones y reclamos) es un acuerdo directo y exclusivo entre comprador y vendedor.",
      "No verificamos la existencia, el estado, la autenticidad, la legalidad ni la titularidad de las paletas publicadas, ni la identidad o la solvencia de los usuarios.",
      "No respondemos por estafas, incumplimientos, productos falsificados, robados o defectuosos, daños, pérdidas ni por ningún perjuicio derivado de una operación acordada a través del sitio.",
    ],
  },
  {
    titulo: "Recomendaciones antes de cerrar una operación",
    parrafos: [
      "Encontrate en un lugar público, revisá la paleta en persona antes de pagar y desconfiá de precios muy por debajo del mercado o de quien te apure para que pagues por adelantado.",
    ],
  },
  {
    titulo: "Obligaciones del usuario",
    parrafos: [
      "Publicás bajo tu responsabilidad: los datos deben ser verdaderos y la paleta tiene que ser tuya y de venta legal. Está prohibido publicar productos robados, falsificados o cuya venta esté restringida.",
      "Podemos dar de baja una publicación o una cuenta que incumpla estos términos, sin aviso previo.",
    ],
  },
  {
    titulo: "Cambios",
    parrafos: [
      "Podemos actualizar estos términos. Si seguís usando Paletita después de una actualización, se entiende que los aceptás.",
    ],
  },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-[680px] px-4 py-6 md:px-6">
      <h1 className="text-[22px]" style={{ color: "#14171A", fontWeight: 800 }}>
        Términos y condiciones
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "#5B6470" }}>
        Última actualización: 14 de agosto de 2026
      </p>

      <div className="mt-6 space-y-6">
        {secciones.map((s) => (
          <section key={s.titulo}>
            <h2 className="text-[16px]" style={{ color: "#14171A", fontWeight: 700 }}>
              {s.titulo}
            </h2>
            {s.parrafos.map((p) => (
              <p key={p} className="mt-2 text-[15px] leading-relaxed" style={{ color: "#14171A" }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
