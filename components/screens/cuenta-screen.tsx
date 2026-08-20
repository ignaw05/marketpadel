"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { Aviso, Field, Submit } from "../campos";
import { cerrarSesion } from "@/app/auth/actions";
import {
  guardarPerfil,
  cambiarPassword,
  type PerfilState,
  type PasswordState,
} from "@/app/(main)/cuenta/actions";

const tarjeta: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E6E4DF",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] p-4 md:p-5" style={tarjeta}>
      <h2 className="mb-4 text-[16px]" style={{ color: "#14171A", fontWeight: 700 }}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function CuentaScreen({
  email,
  perfil,
  plan,
}: {
  email: string;
  perfil: { nombre: string; apellido: string; whatsapp: string };
  /** El estado del plan Pro. Llega ya renderizado: esta pantalla no toca la base. */
  plan?: React.ReactNode;
}) {
  const [datos, guardar] = useActionState<PerfilState, FormData>(guardarPerfil, {});
  const [clave, cambiar] = useActionState<PasswordState, FormData>(cambiarPassword, {});

  const v = datos.valores ?? perfil;
  const e = datos.campos ?? {};
  const ec = clave.campos ?? {};

  return (
    <div className="mx-auto max-w-[560px] space-y-4 px-4 py-6 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Mi cuenta</h1>

      {plan}

      <Seccion titulo="Mis datos">
        <form action={guardar} className="space-y-4" noValidate>
          {datos.error && <Aviso tipo="error">{datos.error}</Aviso>}
          {datos.aviso && !datos.error && <Aviso tipo="ok">{datos.aviso}</Aviso>}

          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={email}
            readOnly
            ayuda="El email no se puede cambiar."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="nombre"
              label="Nombre"
              autoComplete="given-name"
              defaultValue={v.nombre}
              error={e.nombre}
            />
            <Field
              name="apellido"
              label="Apellido"
              autoComplete="family-name"
              defaultValue={v.apellido}
              error={e.apellido}
            />
          </div>

          <Field
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+54 9 11 5555 5555"
            defaultValue={v.whatsapp}
            error={e.whatsapp}
            ayuda="Es el número al que te escriben los compradores."
          />

          <Submit cargando="Guardando…">Guardar cambios</Submit>
        </form>
      </Seccion>

      <Seccion titulo="Contraseña">
        <form action={cambiar} className="space-y-4" noValidate>
          {clave.error && <Aviso tipo="error">{clave.error}</Aviso>}
          {clave.aviso && !clave.error && <Aviso tipo="ok">{clave.aviso}</Aviso>}

          <Field
            name="actual"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={ec.actual}
          />
          <Field
            name="nueva"
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={ec.nueva}
            ayuda="Mínimo 8 caracteres."
          />
          <Field
            name="repetir"
            label="Repetir la nueva"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={ec.repetir}
          />

          <Submit cargando="Cambiando…" variante="borde">
            Cambiar contraseña
          </Submit>
        </form>
      </Seccion>

      {/* Cerrar sesión vive acá y no en el menú del header: el menú quedó con
          las dos secciones a las que se va, y esto es una acción, no un lugar. */}
      <Seccion titulo="Sesión">
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] transition-colors hover:bg-[#F2F1ED] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              border: "1px solid #E6E4DF",
              color: "#14171A",
              fontWeight: 600,
              outlineColor: "#057305",
            }}
          >
            <LogOut size={18} aria-hidden /> Cerrar sesión
          </button>
        </form>
      </Seccion>
    </div>
  );
}
