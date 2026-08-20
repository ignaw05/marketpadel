"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const VERDE = "#057305";
export const ROJO = "#D4183D";

/** El asterisco es decorativo: el dato real lo da `required` en el input. */
export function Obligatorio() {
  return (
    <span aria-hidden="true" style={{ color: ROJO }}>
      {" *"}
    </span>
  );
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: "error" | "ok";
  children: React.ReactNode;
}) {
  const error = tipo === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className="flex items-start gap-2 rounded-[14px] p-3 text-[13px]"
      style={{
        background: error ? "rgba(212,24,61,0.08)" : "rgba(5,115,5,0.08)",
        color: error ? "#A31232" : VERDE,
      }}
    >
      {error ? (
        <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 size={16} className="mt-px shrink-0" aria-hidden />
      )}
      {children}
    </p>
  );
}

export const campoClass =
  "min-h-[44px] w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

export const campoStyle = (error?: string): React.CSSProperties => ({
  background: "#FAFAF8",
  border: `1px solid ${error ? ROJO : "#E6E4DF"}`,
  color: "#14171A",
  outlineColor: VERDE,
});

export function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} className="mt-1 text-[13px]" style={{ color: ROJO }}>
      {mensaje}
    </p>
  );
}

export function Field({
  id: idProp,
  name,
  label,
  type = "text",
  placeholder,
  error,
  defaultValue,
  autoComplete,
  inputMode,
  readOnly,
  ayuda,
  opcional,
}: {
  id?: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  /** Campo inmutable: se muestra apagado y no se manda al server. */
  readOnly?: boolean;
  ayuda?: string;
  /** Se puede dejar vacío: sin asterisco y sin `required`. */
  opcional?: boolean;
}) {
  const id = idProp ?? `campo-${name}`;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div>
      <label className="mb-1.5 block text-[14px]" style={{ color: "#14171A" }} htmlFor={id}>
        {label}
        {!readOnly && !opcional && <Obligatorio />}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={!readOnly && !opcional}
        readOnly={readOnly}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        aria-describedby={[idError, idAyuda].filter(Boolean).join(" ") || undefined}
        className={campoClass}
        style={{
          ...campoStyle(error),
          // readOnly y no disabled: sigue siendo enfocable y se puede copiar.
          ...(readOnly ? { background: "#F2F1ED", color: "#5B6470" } : null),
        }}
      />
      <ErrorCampo id={`${id}-error`} mensaje={error} />
      {ayuda && (
        <p id={idAyuda} className="mt-1.5 text-[13px]" style={{ color: "#5B6470" }}>
          {ayuda}
        </p>
      )}
    </div>
  );
}

export function Submit({
  children,
  cargando,
  variante = "solido",
}: {
  children: string;
  cargando: string;
  variante?: "solido" | "borde";
}) {
  const { pending } = useFormStatus();
  const borde = variante === "borde";
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] w-full rounded-[14px] py-3 text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: borde ? "#FFFFFF" : VERDE,
        border: borde ? "1px solid #E6E4DF" : undefined,
        color: borde ? "#14171A" : "#FFFFFF",
        fontWeight: 600,
        outlineColor: VERDE,
      }}
    >
      {pending ? cargando : children}
    </button>
  );
}
