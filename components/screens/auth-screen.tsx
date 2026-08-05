"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Logo } from "../logo";
import { ImageWithFallback } from "../image-with-fallback";
import { autenticar, type AuthState } from "@/app/auth/actions";

const COURT_IMG =
  "https://images.unsplash.com/photo-1646649853517-e2f75cde1908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
  defaultValue,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  const id = `auth-${name}`;
  return (
    <div>
      <label className="mb-1.5 block text-[14px]" style={{ color: "#14171A" }} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-[44px] w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: "#FAFAF8",
          border: `1px solid ${error ? "#D4183D" : "#E6E4DF"}`,
          color: "#14171A",
          outlineColor: "#0F5132",
        }}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[13px]" style={{ color: "#D4183D" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Submit({ modo }: { modo: "login" | "registro" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] w-full rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
    >
      {pending
        ? modo === "login"
          ? "Ingresando…"
          : "Creando cuenta…"
        : modo === "login"
          ? "Ingresar"
          : "Crear mi cuenta"}
    </button>
  );
}

export function AuthScreen() {
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [state, formAction] = useActionState<AuthState, FormData>(autenticar, {});
  const v = state.valores ?? {};

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2" style={{ background: "#FAFAF8" }}>
      {/* Panel izquierdo (solo desktop) */}
      <div
        className="relative hidden lg:flex lg:flex-col lg:justify-end lg:p-12"
        style={{ background: "#F2F1ED" }}
      >
        <ImageWithFallback src={COURT_IMG} alt="" sizes="50vw" className="object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,23,26,0) 30%, rgba(20,23,26,0.65) 100%)" }}
        />
        <div className="relative">
          <h2 className="text-white" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>
            El mercado de paletas usadas más confiable de Argentina
          </h2>
          <p className="mt-3 text-white/80" style={{ maxWidth: 420 }}>
            Comprá y vendé paletas de pádel entre jugadores. Directo, sin vueltas y por WhatsApp.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          {/* Tabs */}
          <div
            className="mb-6 grid grid-cols-2 gap-1 rounded-[14px] p-1"
            style={{ background: "#F2F1ED" }}
          >
            {(["login", "registro"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className="min-h-[44px] rounded-[10px] py-2 text-[14px] transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  background: tab === t ? "#FFFFFF" : "transparent",
                  color: tab === t ? "#14171A" : "#5B6470",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  fontWeight: 600,
                  outlineColor: "#0F5132",
                }}
              >
                {t === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form action={formAction} className="space-y-4" noValidate>
            <input type="hidden" name="modo" value={tab} />

            {state.error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-[14px] p-3 text-[13px]"
                style={{ background: "rgba(212,24,61,0.08)", color: "#A31232" }}
              >
                <AlertCircle size={16} className="mt-px shrink-0" />
                {state.error}
              </p>
            )}

            {tab === "registro" && (
              <div className="grid grid-cols-2 gap-3">
                <Field
                  name="nombre"
                  label="Nombre"
                  placeholder="Juan"
                  autoComplete="given-name"
                  defaultValue={v.nombre}
                  error={state.campos?.nombre}
                />
                <Field
                  name="apellido"
                  label="Apellido"
                  placeholder="Pérez"
                  autoComplete="family-name"
                  defaultValue={v.apellido}
                  error={state.campos?.apellido}
                />
              </div>
            )}

            <Field
              name="email"
              label="Email"
              type="email"
              placeholder="vos@email.com"
              autoComplete="email"
              defaultValue={v.email}
              error={state.campos?.email}
            />

            {tab === "registro" && (
              <Field
                name="whatsapp"
                label="WhatsApp"
                type="tel"
                placeholder="+54 9 11 5555 5555"
                autoComplete="tel"
                defaultValue={v.whatsapp}
                error={state.campos?.whatsapp}
              />
            )}

            <Field
              name="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              error={state.campos?.password}
            />

            <Submit modo={tab} />
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: "#5B6470" }}>
            {tab === "login" ? "¿Todavía no tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button
              type="button"
              onClick={() => setTab(tab === "login" ? "registro" : "login")}
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
            >
              {tab === "login" ? "Registrate" : "Ingresá"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
