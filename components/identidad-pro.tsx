"use client";

import { useActionState } from "react";
import { Aviso, Submit } from "./campos";
import { CamposVendedor } from "./campos-vendedor";
import { guardarIdentidad, type IdentidadState } from "@/app/(main)/pro/actions";

/**
 * Cómo lo ven los compradores. Vive dentro de la tarjeta Pro porque es acá donde
 * el dato importa: con el plan activo, el negocio es lo que sale en la cinta de
 * todas sus publicaciones y el título de su cartelera.
 *
 * Los mismos dos campos están en "Mis datos" más abajo, para el que los busca
 * donde están el resto de sus datos.
 */
export function IdentidadPro({ negocio, provincia }: { negocio: string; provincia: string }) {
  const [state, guardar] = useActionState<IdentidadState, FormData>(guardarIdentidad, {});

  const v = state.valores ?? { negocio, provincia };
  const e = state.campos ?? {};

  return (
    <details className="mt-4">
      <summary
        className="flex min-h-[44px] cursor-pointer items-center text-[14px]"
        style={{ color: "#057305", fontWeight: 600 }}
      >
        Cómo te ven los compradores
      </summary>

      <form action={guardar} className="mt-3 space-y-4" noValidate>
        {state.error && <Aviso tipo="error">{state.error}</Aviso>}
        {state.aviso && !state.error && <Aviso tipo="ok">{state.aviso}</Aviso>}

        <CamposVendedor
          negocio={v.negocio}
          provincia={v.provincia}
          errorNegocio={e.negocio}
          errorProvincia={e.provincia}
        />

        <Submit cargando="Guardando…" variante="borde">
          Guardar
        </Submit>
      </form>
    </details>
  );
}
