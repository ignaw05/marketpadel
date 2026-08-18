"use client";

import { useEffect, useState } from "react";
import { aviso } from "@/lib/actividad";

const VISIBLE_MS = 5000;
const CICLO_MS = 13000;

/**
 * Cartelito de actividad abajo a la derecha. Es decorativo y los datos son
 * inventados: va `aria-hidden` para no ensuciar el lector de pantalla con
 * movimiento que no es informacion real.
 */
export function Actividad() {
  const [texto, setTexto] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Sin el primer render en blanco habria mismatch de hidratacion: el texto
    // sale de Math.random().
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const ciclo = setInterval(() => {
      if (document.hidden) return;
      setTexto(aviso());
      setVisible(true);
      timeouts.push(setTimeout(() => setVisible(false), VISIBLE_MS));
    }, CICLO_MS);

    return () => {
      clearInterval(ciclo);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  if (!texto) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed bottom-4 right-4 z-30 max-w-[calc(100vw-2rem)] rounded-[14px] px-3 py-2.5 transition-opacity duration-300 motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        boxShadow: "0 6px 20px rgba(20, 23, 26, 0.10)",
      }}
    >
      <p className="flex items-center gap-2 text-[13px]" style={{ color: "#14171A" }}>
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: "#057305" }}
        />
        {texto}
      </p>
    </div>
  );
}
