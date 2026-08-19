"use client";

import { useActionState, useState } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { Logo } from "../logo";
import {
  Aviso,
  ErrorCampo,
  Field,
  Obligatorio,
  Submit,
  campoClass,
  campoStyle,
  ROJO,
  VERDE,
} from "../campos";
import {
  autenticar,
  reenviarConfirmacion,
  pedirReset,
  definirPassword,
  type AuthState,
  type NuevaPasswordState,
} from "@/app/auth/actions";
import { PREFIJO_WHATSAPP } from "@/lib/validar";


/** Prefijo editable al lado del número. Arranca en +54 9. */
function CampoWhatsapp({
  error,
  prefijo,
  numero,
}: {
  error?: string;
  prefijo?: string;
  numero?: string;
}) {
  return (
    <fieldset aria-describedby={error ? "auth-whatsapp-error" : undefined}>
      <legend className="mb-1.5 text-[14px]" style={{ color: "#14171A" }}>
        WhatsApp
        <Obligatorio />
      </legend>
      <div className="flex gap-2">
        <div className="w-[92px] shrink-0">
          <label className="sr-only" htmlFor="auth-whatsapp-prefijo">
            Código de país y área
          </label>
          <input
            id="auth-whatsapp-prefijo"
            name="whatsapp_prefijo"
            type="text"
            required
            inputMode="tel"
            defaultValue={prefijo ?? PREFIJO_WHATSAPP}
            aria-invalid={!!error}
            className={`${campoClass} text-center`}
            style={campoStyle(error)}
          />
        </div>
        <div className="flex-1">
          <label className="sr-only" htmlFor="auth-whatsapp-numero">
            Número de WhatsApp, sin el prefijo
          </label>
          <input
            id="auth-whatsapp-numero"
            name="whatsapp_numero"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="11 5555 5555"
            defaultValue={numero}
            aria-invalid={!!error}
            className={campoClass}
            style={campoStyle(error)}
          />
        </div>
      </div>
      <ErrorCampo id="auth-whatsapp-error" mensaje={error} />
    </fieldset>
  );
}

/** Marco compartido: panel de la izquierda en desktop, contenido centrado. */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2" style={{ background: "#FAFAF8" }}>
      {/* ponytail: la foto es decorativa y solo se ve en desktop, asi que va como
          background de CSS y no como <Image>. Dentro de un display:none el
          navegador no baja un background: en celular no se descarga nada. */}
      <div
        className="relative hidden lg:flex lg:flex-col lg:justify-end lg:p-12"
        style={{ background: "#F2F1ED url(/cancha.webp) center / cover no-repeat" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,23,26,0) 30%, rgba(20,23,26,0.65) 100%)",
          }}
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

      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Mismo look que Submit variante="borde", pero no manda el form. */
function Volver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] w-full rounded-[14px] py-3 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E4DF",
        color: "#14171A",
        fontWeight: 600,
        outlineColor: VERDE,
      }}
    >
      Volver
    </button>
  );
}

/** Cabecera de las pantallas de un solo paso: icono, titulo y bajada. */
function Encabezado({
  icono: Icono,
  titulo,
  children,
}: {
  icono: typeof MailCheck;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "rgba(5,115,5,0.08)" }}
      >
        <Icono size={30} style={{ color: VERDE }} aria-hidden />
      </div>
      <h1 className="mt-5" style={{ color: "#14171A", fontWeight: 700, fontSize: 22 }}>
        {titulo}
      </h1>
      <p className="mt-2 text-[15px]" style={{ color: "#5B6470", lineHeight: 1.6 }}>
        {children}
      </p>
    </>
  );
}

function Olvide({ email, onVolver }: { email?: string; onVolver: () => void }) {
  const [state, formAction] = useActionState<AuthState, FormData>(pedirReset, {});

  return (
    <div className="text-center">
      <Encabezado icono={KeyRound} titulo="Restablecer contraseña">
        Escribí tu email y te mandamos un link para elegir una nueva.
      </Encabezado>

      <div className="mt-6 space-y-3 text-left">
        {state.error && <Aviso tipo="error">{state.error}</Aviso>}
        {state.aviso && !state.error && <Aviso tipo="ok">{state.aviso}</Aviso>}

        <form action={formAction} className="space-y-3" noValidate>
          <Field
            id="reset-email"
            name="email"
            label="Email"
            type="email"
            placeholder="vos@email.com"
            autoComplete="email"
            defaultValue={state.valores?.email ?? email}
            error={state.campos?.email}
          />
          <Submit cargando="Enviando…">Enviarme el link</Submit>
        </form>

        <Volver onClick={onVolver} />
      </div>
    </div>
  );
}

/** Se llega desde el link del mail, con la sesión ya abierta. */
export function NuevaPasswordScreen() {
  const [state, formAction] = useActionState<NuevaPasswordState, FormData>(
    definirPassword,
    {},
  );
  const e = state.campos ?? {};

  return (
    <Marco>
      <div className="text-center">
        <Encabezado icono={KeyRound} titulo="Elegí tu nueva contraseña">
          Después de guardarla entrás derecho a Paletita.
        </Encabezado>

        <form action={formAction} className="mt-6 space-y-4 text-left" noValidate>
          {state.error && <Aviso tipo="error">{state.error}</Aviso>}

          <Field
            name="nueva"
            label="Contraseña nueva"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={e.nueva}
            ayuda="Mínimo 8 caracteres."
          />
          <Field
            name="repetir"
            label="Repetir la contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={e.repetir}
          />

          <Submit cargando="Guardando…">Guardar</Submit>
        </form>
      </div>
    </Marco>
  );
}

function EsperandoConfirmacion({
  email,
  avisoInicial,
  onVolver,
}: {
  email: string;
  avisoInicial?: string;
  onVolver: () => void;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(reenviarConfirmacion, {
    pendiente: email,
    aviso: avisoInicial,
  });

  return (
    <div className="text-center">
      <Encabezado icono={MailCheck} titulo="Revisá tu mail">
        Te mandamos un link a <strong style={{ color: "#14171A" }}>{email}</strong> para
        confirmar la cuenta. Abrilo y entrás derecho a Paletita.
      </Encabezado>
      <p className="mt-3 text-[13px]" style={{ color: "#5B6470" }}>
        Si no lo ves, fijate en spam o en promociones. El link vence en una hora.
      </p>

      <div className="mt-6 space-y-3 text-left">
        {state.error && <Aviso tipo="error">{state.error}</Aviso>}
        {state.aviso && !state.error && <Aviso tipo="ok">{state.aviso}</Aviso>}

        <form action={formAction}>
          <input type="hidden" name="email" value={email} />
          <Submit cargando="Reenviando…">Reenviar el mail</Submit>
        </form>

        <Volver onClick={onVolver} />
      </div>
    </div>
  );
}

export function AuthScreen({
  errorInicial,
  next,
}: {
  errorInicial?: string;
  next: string;
}) {
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [state, formAction] = useActionState<AuthState, FormData>(autenticar, {});
  const [descartado, setDescartado] = useState(false);
  const [olvide, setOlvide] = useState(false);

  const v = state.valores ?? {};
  const e = state.campos ?? {};
  const error = state.error ?? (state.campos || state.pendiente ? undefined : errorInicial);

  if (olvide) {
    return (
      <Marco>
        <Olvide email={v.email} onVolver={() => setOlvide(false)} />
      </Marco>
    );
  }

  if (state.pendiente && !descartado) {
    return (
      <Marco>
        <EsperandoConfirmacion
          email={state.pendiente}
          avisoInicial={state.aviso}
          onVolver={() => setDescartado(true)}
        />
      </Marco>
    );
  }

  return (
    <Marco>
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
              outlineColor: VERDE,
            }}
          >
            {t === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="modo" value={tab} />
        <input type="hidden" name="next" value={next} />

        {error && <Aviso tipo="error">{error}</Aviso>}

        <p className="text-[13px]" style={{ color: "#5B6470" }}>
          Los campos con <span style={{ color: ROJO }}>*</span> son obligatorios.
        </p>

        {tab === "registro" && (
          <div className="grid grid-cols-2 gap-3">
            <Field
              name="nombre"
              label="Nombre"
              placeholder="Juan"
              autoComplete="given-name"
              defaultValue={v.nombre}
              error={e.nombre}
            />
            <Field
              name="apellido"
              label="Apellido"
              placeholder="Pérez"
              autoComplete="family-name"
              defaultValue={v.apellido}
              error={e.apellido}
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
          error={e.email}
        />

        {tab === "registro" && (
          <CampoWhatsapp
            error={e.whatsapp}
            prefijo={v.whatsappPrefijo}
            numero={v.whatsappNumero}
          />
        )}

        <Field
          name="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete={tab === "login" ? "current-password" : "new-password"}
          error={e.password}
        />

        {tab === "login" && (
          <p className="text-right">
            <button
              type="button"
              onClick={() => setOlvide(true)}
              className="min-h-[44px] rounded text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: VERDE, fontWeight: 600, outlineColor: VERDE }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        <Submit cargando={tab === "login" ? "Ingresando…" : "Creando cuenta…"}>
          {tab === "login" ? "Ingresar" : "Crear mi cuenta"}
        </Submit>
      </form>

      <p className="mt-6 text-center text-[13px]" style={{ color: "#5B6470" }}>
        {tab === "login" ? "¿Todavía no tenés cuenta? " : "¿Ya tenés cuenta? "}
        <button
          type="button"
          onClick={() => setTab(tab === "login" ? "registro" : "login")}
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: VERDE, fontWeight: 600, outlineColor: VERDE }}
        >
          {tab === "login" ? "Registrate" : "Ingresá"}
        </button>
      </p>
    </Marco>
  );
}
