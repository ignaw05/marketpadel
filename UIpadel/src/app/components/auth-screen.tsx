import { useState } from "react";
import { Logo } from "./logo";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const COURT_IMG =
  "https://images.unsplash.com/photo-1646649853517-e2f75cde1908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

function Field({
  label,
  type = "text",
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px]" style={{ color: "#14171A" }}>
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none transition-colors"
        style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#0F5132")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#E6E4DF")}
      />
    </label>
  );
}

export function AuthScreen({ onEnter }: { onEnter: () => void }) {
  const [tab, setTab] = useState<"login" | "registro">("login");

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2" style={{ background: "#FAFAF8" }}>
      {/* Panel izquierdo (solo desktop) */}
      <div
        className="relative hidden lg:flex lg:flex-col lg:justify-end lg:p-12"
        style={{ background: "#F2F1ED" }}
      >
        <ImageWithFallback
          src={COURT_IMG}
          alt="Paletas de pádel"
          className="absolute inset-0 h-full w-full object-cover"
        />
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
                onClick={() => setTab(t)}
                className="rounded-[10px] py-2 text-[14px] transition-all"
                style={{
                  background: tab === t ? "#FFFFFF" : "transparent",
                  color: tab === t ? "#14171A" : "#6B7280",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  fontWeight: 600,
                }}
              >
                {t === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onEnter();
            }}
          >
            {tab === "registro" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" placeholder="Juan" />
                <Field label="Apellido" placeholder="Pérez" />
              </div>
            )}
            <Field label="Email" type="email" placeholder="vos@email.com" />
            {tab === "registro" && (
              <Field label="WhatsApp" placeholder="+54 9 11 5555 5555" />
            )}
            <Field label="Contraseña" type="password" placeholder="••••••••" />

            <button
              type="submit"
              className="w-full rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#0F5132", fontWeight: 600 }}
            >
              {tab === "login" ? "Ingresar" : "Crear mi cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: "#6B7280" }}>
            {tab === "login" ? "¿Todavía no tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button
              onClick={() => setTab(tab === "login" ? "registro" : "login")}
              style={{ color: "#0F5132", fontWeight: 600 }}
            >
              {tab === "login" ? "Registrate" : "Ingresá"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
