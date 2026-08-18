import { ImageResponse } from "next/og";

// Lo que se ve cuando alguien pega el link en WhatsApp, que es como circula
// esto. Sin imagen, la vista previa sale gris y nadie la abre.
export const alt = "Paletita — paletas de pádel usadas en Argentina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#057305",
          color: "#FFFFFF",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, color: "#C7F751", fontWeight: 700 }}>Paletita</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>
          Paletas de pádel usadas en Argentina
        </div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.9 }}>
          Comprá y vendé entre jugadores. Publicar es gratis.
        </div>
      </div>
    ),
    size,
  );
}
