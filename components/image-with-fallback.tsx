"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { miniatura } from "@/lib/paletas";

/**
 * Foto de producto. Usa next/image con `fill`, asi que el padre tiene que ser
 * `relative` y tener alto propio. Cae a un placeholder si no hay foto o si la
 * URL del bucket ya no resuelve.
 *
 * `mini` pide primero la variante de 400px que se sube junto a la foto original
 * (ver `miniatura` en lib/paletas). Las publicaciones anteriores a eso no la
 * tienen: ahi la cadena cae sola a la foto grande, y recien despues al placeholder.
 */
export function ImageWithFallback({
  src,
  alt,
  sizes,
  className,
  priority,
  mini,
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  mini?: boolean;
}) {
  const candidatas = !src ? [] : mini ? [miniatura(src), src] : [src];
  const [intento, setIntento] = useState(0);

  // Reiniciar la cadena cuando cambia la foto: sin esto, la lupa de la galeria se
  // queda con el fallback de la foto anterior al pasar a la siguiente.
  const [previa, setPrevia] = useState(src);
  if (previa !== src) {
    setPrevia(src);
    setIntento(0);
  }

  const actual = candidatas[intento];

  if (!actual) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "#F2F1ED" }}
      >
        <ImageOff size={28} style={{ color: "#9AA1AA" }} aria-hidden />
        <span className="sr-only">Sin foto</span>
      </div>
    );
  }

  return (
    <Image
      src={actual}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setIntento(intento + 1)}
    />
  );
}
