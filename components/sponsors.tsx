import Image from "next/image";
import type { Sponsor } from "@/lib/sponsors-db";

/** Ancho fijo del hueco de cada logo: normaliza logos de proporciones distintas. */
const SLOT = "h-7 w-[104px]";

/** Lo que ocupa un sponsor en la tira: el hueco mas el padding del <li>. */
const PASO = 104 + 32;

/** Pantalla mas ancha que tiene que quedar cubierta sin huecos. */
const ANCHO_MAX = 1920;

function Logo({ s }: { s: Sponsor }) {
  return (
    <span className={`relative block shrink-0 ${SLOT}`}>
      <Image
        src={s.logo_url}
        alt={s.nombre}
        fill
        sizes="104px"
        className="object-contain"
      />
    </span>
  );
}

function Item({ s, copia }: { s: Sponsor; copia?: boolean }) {
  const contenido = <Logo s={s} />;

  return (
    <li className="flex shrink-0 items-center px-4">
      {s.link ? (
        <a
          href={s.link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          // La copia no es enfocable: tabular por la tira no puede pasar dos
          // veces por el mismo sponsor.
          tabIndex={copia ? -1 : undefined}
          className="flex min-h-[44px] items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: "#057305" }}
        >
          {contenido}
          <span className="sr-only">
            {s.nombre} (abre en una pestaña nueva)
          </span>
        </a>
      ) : (
        <span className="flex min-h-[44px] items-center">{contenido}</span>
      )}
    </li>
  );
}

/**
 * La tira de sponsors: lo ultimo que queda fijo abajo del header cuando se
 * scrollea.
 *
 * El loop es una sola animacion de CSS sobre dos copias identicas de la lista,
 * moviendo el contenedor -50%: cuando la primera copia termina de salir, la
 * segunda esta exactamente donde arrancaba la primera y el salto no se ve. Por
 * eso la separacion va como padding de cada <li> y no como `gap` del
 * contenedor: con gap las dos copias no miden lo mismo y el -50% queda corto.
 *
 * ponytail: CSS puro, sin libreria de carrusel ni JS de scroll. Si algun dia
 * hacen falta flechas o autoplay pausable por el usuario, ahi entra JS.
 */
export function Sponsors({ sponsors }: { sponsors: Sponsor[] }) {
  // Sin sponsors no hay banda: la tira no ocupa alto ni tira sombra.
  if (sponsors.length === 0) return null;

  // Velocidad constante en px/s: con una duracion fija, tres sponsors pasan
  // volando y quince se arrastran. No depende de cuantas copias haya: cada
  // vuelta de la animacion recorre siempre una copia.
  const segundos = Math.max(16, sponsors.length * 6);

  // Cuantas veces repetir la lista. Con dos copias alcanzaba en mobile, pero en
  // 1440px un solo sponsor da un riel de 136px sobre una banda de 1440: la tira
  // se ve vacia la mayor parte del tiempo. Hace falta que el riel cubra la
  // pantalla MAS una copia entera, que es lo que se desplaza en cada vuelta.
  const copias = Math.min(
    24,
    Math.max(2, Math.ceil(ANCHO_MAX / (sponsors.length * PASO)) + 1),
  );

  return (
    <section
      aria-label="Sponsors"
      className="overflow-hidden motion-reduce:overflow-x-auto"
      style={{
        background: "#FBF9F5",
        boxShadow: "0 4px 14px rgba(20, 23, 26, 0.12)",
      }}
    >
      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        // --copias lo lee el keyframe: se desplaza 100%/copias, o sea exactamente
        // una copia, y al terminar la de al lado quedo en el mismo lugar.
        style={{ animationDuration: `${segundos}s`, ["--copias" as string]: copias }}
      >
        <ul className="flex">
          {sponsors.map((s) => (
            <Item key={s.id} s={s} />
          ))}
        </ul>
        {/* Las copias que hacen el loop. Para un lector de pantalla la tira
            tiene un solo juego de sponsors, no varios. */}
        {Array.from({ length: copias - 1 }, (_, i) => (
          <ul key={i} className="flex motion-reduce:hidden" aria-hidden>
            {sponsors.map((s) => (
              <Item key={s.id} s={s} copia />
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
