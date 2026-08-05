"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

/**
 * Foto de producto. Usa next/image con `fill`, asi que el padre tiene que ser
 * `relative` y tener alto propio. Cae a un placeholder si no hay foto o si la
 * URL del bucket ya no resuelve.
 */
export function ImageWithFallback({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [falló, setFalló] = useState(false);

  if (!src || falló) {
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
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFalló(true)}
    />
  );
}
