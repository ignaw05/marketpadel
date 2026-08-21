"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BadgeCheck, Check, X } from "lucide-react";
import { marcarAnuncioPro } from "@/app/(main)/pro/actions";
import { PLAN_PRO } from "@/lib/pro";
import { formatPrecio } from "@/lib/paletas";

const VERDE = "#057305";
const LIMA = "#C7F751";

const PUNTOS = [
  ["Distintivo en todas tus paletas.", "El comprador lo ve antes de escribirte."],
  [`${PLAN_PRO.creditos} promociones por mes.`, `${PLAN_PRO.diasPromo} días arriba de todo, cada una.`],
  ["Tu propia cartelera.", "Todo tu catálogo junto en Vendedores Pro."],
];

/**
 * El anuncio del plan, al abrir la portada. Quien decide si corresponde
 * mostrarlo es el layout con debeVerAnuncioPro: si este componente se monta,
 * se abre.
 *
 * ponytail: <dialog> nativo. El foco atrapado, Escape y el fondo oscuro vienen
 * de fabrica. En celular se pega abajo (mt-auto) porque el pulgar llega ahi;
 * desde sm vuelve al centro.
 */
export function AnuncioPro() {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogo.current?.showModal();
    // Al abrirse, no al cerrarse: todas las salidas cuentan como visto. El
    // catch no es decorativo: sin el, una marca fallida queda como promesa
    // rechazada suelta y en dev abre el overlay de error encima del anuncio.
    marcarAnuncioPro().catch(() => {});
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="anuncio-pro-titulo"
      className="mx-auto mb-0 mt-auto w-full max-w-[480px] rounded-t-[22px] p-5 backdrop:bg-[rgba(20,23,26,0.55)] sm:my-auto sm:w-[calc(100vw-2rem)] sm:rounded-[20px] sm:p-7"
      style={{ background: "#FFFFFF", color: "#14171A" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
          style={{ background: LIMA, fontWeight: 700 }}
        >
          <BadgeCheck size={12} aria-hidden /> Vendedor Pro
        </span>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="-mr-2.5 -mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#5B6470", outlineColor: VERDE }}
        >
          <X size={20} aria-hidden />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>

      <h2
        id="anuncio-pro-titulo"
        className="mt-3.5 text-[26px] sm:text-[30px]"
        style={{ fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.035em", textWrap: "pretty" }}
      >
        Si sos vendedor de paletas, esto te va a importar
      </h2>

      <p className="mt-3.5 text-[14px] sm:text-[15px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
        Hay un plan para los que venden seguido. Por {formatPrecio(PLAN_PRO.precio)} al mes:
      </p>

      <ul className="mt-3.5 flex flex-col gap-2.5">
        {PUNTOS.map(([titulo, detalle]) => (
          <li key={titulo} className="flex items-start gap-2.5">
            <Check
              size={18}
              strokeWidth={2.75}
              className="mt-0.5 shrink-0"
              style={{ color: VERDE }}
              aria-hidden
            />
            <p className="text-[14px] sm:text-[15px]" style={{ lineHeight: 1.45 }}>
              <span style={{ fontWeight: 700 }}>{titulo}</span>{" "}
              <span style={{ color: "#5B6470" }}>{detalle}</span>
            </p>
          </li>
        ))}
      </ul>

      <Link
        href="/pro"
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-[14px] px-4 text-[16px] text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: VERDE, fontWeight: 700, letterSpacing: "-0.015em", outlineColor: VERDE }}
      >
        Ver cómo funciona
      </Link>

      <button
        type="button"
        onClick={() => dialogo.current?.close()}
        className="flex min-h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: "#5B6470", fontWeight: 600, outlineColor: VERDE }}
      >
        Ahora no
      </button>
    </dialog>
  );
}
