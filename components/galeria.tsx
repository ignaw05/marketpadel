"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
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
        outlineColor: "#057305",
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
  const lupa = useRef<HTMLDialogElement>(null);
  const [actual, setActual] = useState(0);
  const varias = fotos.length > 1;

  const irA = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const destino = Math.min(Math.max(i, 0), fotos.length - 1);
    el.scrollTo({ left: el.clientWidth * destino, behavior: "smooth" });
  };

  return (
    // En desktop la foto ocupaba los 720px del detalle y tapaba los datos.
    <div className="mx-auto w-full md:max-w-[360px]">
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
          style={{ scrollbarWidth: "none", outlineColor: "#057305" }}
        >
          {fotos.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => lupa.current?.showModal()}
              className="relative w-full shrink-0 cursor-zoom-in snap-center overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2"
              style={{ background: "#F2F1ED", aspectRatio: "4 / 5", outlineColor: "#057305" }}
            >
              {/* Fondo: la misma foto ampliada y borroneada. Llena el cuadro sin
                  recortar la paleta ni dejar barras grises al costado. */}
              <div className="absolute inset-0 scale-110 blur-2xl" aria-hidden>
                <ImageWithFallback src={f} alt="" sizes="64px" className="object-cover" />
              </div>
              <ImageWithFallback
                src={f}
                alt={varias ? `${titulo}, foto ${i + 1} de ${fotos.length}` : titulo}
                sizes="(max-width: 768px) 100vw, 360px"
                priority={i === 0}
                className="object-contain p-4"
              />
              <span
                className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "#14171A",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
                aria-hidden
              >
                <ZoomIn size={18} />
              </span>
              <span className="sr-only">Ampliar la foto</span>
            </button>
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
              style={{ outlineColor: "#057305" }}
            >
              <span
                className="block h-2 rounded-full transition-all"
                style={{
                  width: i === actual ? 20 : 8,
                  background: i === actual ? "#057305" : "#D8D5CE",
                }}
              />
              <span className="sr-only">Ver la foto {i + 1}</span>
            </button>
          ))}
        </div>
      )}

      {/* ponytail: <dialog> nativo. Esc, foco atrapado y backdrop los da el
          navegador; el click en cualquier lado cierra. Sin pan ni pinch: si
          algun dia hace falta, ahi entra una libreria de zoom. */}
      <dialog
        ref={lupa}
        onClick={() => lupa.current?.close()}
        aria-label={`${titulo}, foto ampliada`}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/80"
      >
        <div className="relative h-[100dvh] w-screen cursor-zoom-out">
          <ImageWithFallback
            src={fotos[actual]}
            alt={titulo}
            sizes="100vw"
            className="object-contain p-4"
          />
          <button
            type="button"
            onClick={() => lupa.current?.close()}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#14171A",
              outlineColor: "#FFFFFF",
            }}
          >
            <X size={22} aria-hidden />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
      </dialog>
    </div>
  );
}
