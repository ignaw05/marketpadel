"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./image-with-fallback";

function Flecha({
  hacia,
  disabled,
  onClick,
}: {
  hacia: "anterior" | "siguiente";
  disabled: boolean;
  onClick: () => void;
}) {
  const anterior = hacia === "anterior";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-opacity disabled:opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        anterior ? "left-2" : "right-2"
      }`}
      style={{
        background: "rgba(255,255,255,0.92)",
        color: "#14171A",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        outlineColor: "#0F5132",
      }}
    >
      {anterior ? <ChevronLeft size={22} aria-hidden /> : <ChevronRight size={22} aria-hidden />}
      <span className="sr-only">Foto {anterior ? "anterior" : "siguiente"}</span>
    </button>
  );
}

/**
 * ponytail: scroll-snap de CSS + scrollTo. Sin libreria de carousel — el swipe,
 * la inercia y el snap los hace el navegador; las flechas solo empujan el
 * scroll. Upgrade si algun dia hace falta loop infinito o autoplay.
 */
export function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const varias = fotos.length > 1;

  const irA = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const destino = Math.min(Math.max(i, 0), fotos.length - 1);
    el.scrollTo({ left: el.clientWidth * destino, behavior: "smooth" });
  };

  return (
    <div>
      {/* relative propio: las flechas se centran contra la foto, no contra los puntos */}
      <div className="relative">
        <div
          ref={pista}
          // Redondear da el indice aunque el swipe quede a mitad de camino.
          onScroll={(ev) =>
            setActual(
              Math.round(ev.currentTarget.scrollLeft / (ev.currentTarget.clientWidth || 1)),
            )
          }
          // Con foco propio, el teclado recorre la tira con las flechas del navegador.
          tabIndex={varias ? 0 : undefined}
          role={varias ? "group" : undefined}
          aria-label={varias ? `Fotos de ${titulo}` : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
          style={{ scrollbarWidth: "none", outlineColor: "#0F5132" }}
        >
          {fotos.map((f, i) => (
            <div
              key={i}
              className="relative w-full shrink-0 snap-center overflow-hidden"
              style={{ background: "#F2F1ED", aspectRatio: "4 / 5" }}
            >
              {/* Fondo: la misma foto ampliada y borroneada. Llena el cuadro sin
                  recortar la paleta ni dejar barras grises al costado. */}
              <div className="absolute inset-0 scale-110 blur-2xl" aria-hidden>
                <ImageWithFallback src={f} alt="" sizes="64px" className="object-cover" />
              </div>
              <ImageWithFallback
                src={f}
                alt={varias ? `${titulo}, foto ${i + 1} de ${fotos.length}` : titulo}
                sizes="(max-width: 720px) 100vw, 720px"
                priority={i === 0}
                className="object-contain p-4"
              />
            </div>
          ))}
        </div>

        {varias && (
          <>
            <Flecha hacia="anterior" disabled={actual === 0} onClick={() => irA(actual - 1)} />
            <Flecha
              hacia="siguiente"
              disabled={actual === fotos.length - 1}
              onClick={() => irA(actual + 1)}
            />
          </>
        )}
      </div>

      {varias && (
        <div className="mt-2 flex items-center justify-center">
          {fotos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irA(i)}
              aria-current={i === actual ? "true" : undefined}
              className="flex h-11 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: "#0F5132" }}
            >
              <span
                className="block h-2 rounded-full transition-all"
                style={{
                  width: i === actual ? 20 : 8,
                  background: i === actual ? "#0F5132" : "#D8D5CE",
                }}
              />
              <span className="sr-only">Ver la foto {i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
