"use client";

import { useActionState } from "react";
import { Aviso, ErrorCampo, Obligatorio, Submit, campoClass, campoStyle } from "../campos";
import { crearSponsor, type SponsorState } from "@/app/admin/sponsors/actions";

function Campo({
  id,
  label,
  error,
  ayuda,
  obligatorio,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[14px]" style={{ color: "#14171A" }} htmlFor={id}>
        {label}
        {obligatorio && <Obligatorio />}
      </label>
      {children}
      <ErrorCampo id={`${id}-error`} mensaje={error} />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1.5 text-[13px]" style={{ color: "#5B6470" }}>
          {ayuda}
        </p>
      )}
    </div>
  );
}

export function SponsorForm() {
  const [state, accion] = useActionState<SponsorState, FormData>(crearSponsor, {});
  const e = state.campos ?? {};

  return (
    <form
      action={accion}
      className="space-y-4 rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF" }}
      noValidate
    >
      <h2 className="text-[16px]" style={{ color: "#14171A", fontWeight: 700 }}>
        Nuevo sponsor
      </h2>

      {state.error && <Aviso tipo="error">{state.error}</Aviso>}

      <Campo id="nombre" label="Nombre" error={e.nombre} obligatorio>
        <input
          id="nombre"
          name="nombre"
          type="text"
          maxLength={80}
          aria-invalid={!!e.nombre}
          aria-describedby={e.nombre ? "nombre-error" : undefined}
          className={campoClass}
          style={campoStyle(e.nombre)}
        />
      </Campo>

      <Campo
        id="logo"
        label="Logo"
        error={e.logo}
        obligatorio
        ayuda="WebP, PNG, JPG o SVG, hasta 500 KB. Se muestra a 104px de ancho sobre fondo claro."
      >
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/webp,image/png,image/jpeg,image/svg+xml"
          aria-invalid={!!e.logo}
          aria-describedby={`${e.logo ? "logo-error " : ""}logo-ayuda`}
          className={`${campoClass} py-2.5 file:mr-3 file:rounded-[10px] file:border-0 file:bg-[#F2F1ED] file:px-3 file:py-1.5 file:text-[13px]`}
          style={campoStyle(e.logo)}
        />
      </Campo>

      <Campo
        id="link"
        label="Link"
        error={e.link}
        ayuda="Opcional. A dónde va el logo si alguien lo toca."
      >
        <input
          id="link"
          name="link"
          type="url"
          placeholder="https://"
          aria-invalid={!!e.link}
          aria-describedby={`${e.link ? "link-error " : ""}link-ayuda`}
          className={campoClass}
          style={campoStyle(e.link)}
        />
      </Campo>

      <Campo id="orden" label="Orden" ayuda="Más chico, más a la izquierda. Empatan por antigüedad.">
        <input
          id="orden"
          name="orden"
          type="number"
          inputMode="numeric"
          defaultValue={0}
          aria-describedby="orden-ayuda"
          className={`${campoClass} sm:w-32`}
          style={campoStyle()}
        />
      </Campo>

      <Submit cargando="Guardando…">Agregar sponsor</Submit>
    </form>
  );
}
