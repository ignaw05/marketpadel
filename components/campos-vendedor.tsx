"use client";

import { Field, Obligatorio, campoClass, campoStyle, ErrorCampo } from "./campos";
import { PROVINCIAS } from "@/lib/paletas";

/**
 * Negocio y provincia del vendedor. Los mismos dos campos en los tres lugares
 * donde se cargan (registro, "Mis datos" y la tarjeta Pro): el que llega de
 * cualquiera de los tres tiene que ver exactamente lo mismo, y la validación
 * vive una sola vez en errorNegocio/errorProvincia.
 *
 * No usa estado: el valor inicial va por defaultValue y lo demás lo maneja el
 * form nativo. Así el mismo componente sirve dentro de un form controlado o no.
 */
export function CamposVendedor({
  negocio,
  provincia,
  errorNegocio,
  errorProvincia,
}: {
  negocio?: string;
  provincia?: string;
  errorNegocio?: string;
  errorProvincia?: string;
}) {
  return (
    <>
      <Field
        name="negocio"
        label="Nombre del negocio"
        placeholder="Ej: Padel Store Córdoba"
        autoComplete="organization"
        defaultValue={negocio}
        error={errorNegocio}
        opcional
        ayuda="Si vendés a nombre de un local, es lo que ven los compradores en vez de tu nombre. Dejalo vacío si vendés a título personal."
      />

      <div>
        <label
          className="mb-1.5 block text-[14px]"
          style={{ color: "#14171A" }}
          htmlFor="campo-provincia"
        >
          Provincia
          <Obligatorio />
        </label>
        <select
          id="campo-provincia"
          name="provincia"
          required
          defaultValue={provincia ?? ""}
          aria-invalid={!!errorProvincia}
          aria-describedby={errorProvincia ? "campo-provincia-error" : undefined}
          className={campoClass}
          style={campoStyle(errorProvincia)}
        >
          <option value="" disabled>
            Elegí provincia
          </option>
          {PROVINCIAS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <ErrorCampo id="campo-provincia-error" mensaje={errorProvincia} />
      </div>
    </>
  );
}
