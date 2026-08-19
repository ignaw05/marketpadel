import Image from "next/image";

/**
 * El logo del header, en lima #c8ff28 sobre la barra verde #057305 (los dos
 * colores de marca del manual). El PNG viene con fondo transparente y con el
 * area de resguardo ya adentro, asi que no lleva padding propio.
 *
 * 35px de alto: es la medida del mockup (596x196 al 0.54 del artboard de 3x).
 *
 * `alt` con el nombre y no vacio: el logo es el unico contenido del link a la
 * home, sin texto no tendria nombre accesible.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo-header.png"
      alt="Paletita"
      width={596}
      height={196}
      className={`h-[35px] w-auto ${className}`}
      priority
    />
  );
}
