"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  validarAuth,
  validarPasswordNueva,
  errorEmail,
  armarWhatsapp,
  destinoSeguro,
  type CampoAuth,
  type CampoPassword,
  type Errores,
} from "@/lib/validar";

export type AuthState = {
  error?: string;
  campos?: Errores<CampoAuth>;
  valores?: Record<string, string>;
  /** Email al que se mandó la confirmación. Prende la pantalla de espera. */
  pendiente?: string;
  aviso?: string;
};

export type NuevaPasswordState = {
  error?: string;
  campos?: Errores<CampoPassword>;
};

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** A dónde vuelve el link del mail. Sale del request, así anda en dev y en prod. */
async function origen() {
  const h = await headers();
  return (
    h.get("origin") ??
    (h.get("host") ? `https://${h.get("host")}` : "http://localhost:3000")
  );
}

const urlDeConfirmacion = async () => `${await origen()}/auth/confirmar`;

export async function autenticar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const modo = texto(formData, "modo") === "registro" ? "registro" : "login";
  const next = destinoSeguro(texto(formData, "next"));
  const email = texto(formData, "email");
  const password = String(formData.get("password") ?? "");
  const nombre = texto(formData, "nombre");
  const apellido = texto(formData, "apellido");
  // Sin fallback a PREFIJO_WHATSAPP: el default lo pone el campo del form. Si
  // el usuario lo borro a proposito, que se lo diga la validacion.
  const whatsappPrefijo = texto(formData, "whatsapp_prefijo");
  const whatsappNumero = texto(formData, "whatsapp_numero");

  const valores = { email, nombre, apellido, whatsappPrefijo, whatsappNumero };

  const campos = validarAuth(
    { email, password, nombre, apellido, whatsappPrefijo, whatsappNumero },
    modo,
  );
  if (Object.keys(campos).length) return { campos, valores };

  const supabase = await createClient();

  if (modo === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        return {
          pendiente: email,
          aviso: "Todavía no confirmaste tu cuenta.",
        };
      }
      return {
        error:
          error.code === "invalid_credentials"
            ? "Email o contraseña incorrectos."
            : "No pudimos ingresar. Probá de nuevo en un momento.",
        valores,
      };
    }
  } else {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: await urlDeConfirmacion(),
        data: {
          nombre,
          apellido,
          whatsapp: armarWhatsapp(whatsappPrefijo, whatsappNumero),
        },
      },
    });

    if (error) {
      return {
        error:
          error.code === "over_email_send_rate_limit"
            ? "Se mandaron muchos mails seguidos. Esperá unos minutos y probá de nuevo."
            : "No pudimos crear la cuenta. Probá de nuevo en un momento.",
        valores,
      };
    }

    // Si el proyecto pide confirmar, signUp no devuelve sesion.
    if (!data.session) return { pendiente: email };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function reenviarConfirmacion(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = texto(formData, "email");
  if (!email) return { pendiente: email, error: "Falta el email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await urlDeConfirmacion() },
  });

  if (error) {
    return {
      pendiente: email,
      error:
        error.code === "over_email_send_rate_limit"
          ? "Hay un límite de mails por hora. Esperá un rato antes de pedir otro."
          : "No pudimos reenviarlo. Probá de nuevo en un momento.",
    };
  }

  return { pendiente: email, aviso: "Listo, te lo mandamos de nuevo." };
}

export async function pedirReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = texto(formData, "email");
  const error = errorEmail(email);
  if (error) return { campos: { email: error }, valores: { email } };

  const supabase = await createClient();
  const { error: falla } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origen()}/auth/confirmar`,
  });

  if (falla?.code === "over_email_send_rate_limit") {
    return {
      valores: { email },
      error: "Hay un límite de mails por hora. Esperá un rato y probá de nuevo.",
    };
  }

  // A propósito no distinguimos si el mail existe: si no, sabrían qué cuentas hay.
  return {
    valores: { email },
    aviso: `Si hay una cuenta con ${email}, te mandamos el link para restablecerla.`,
  };
}

/** Segundo paso del reset: el link ya dejó una sesión abierta. */
export async function definirPassword(
  _prev: NuevaPasswordState,
  formData: FormData,
): Promise<NuevaPasswordState> {
  const datos = {
    nueva: String(formData.get("nueva") ?? ""),
    repetir: String(formData.get("repetir") ?? ""),
  };

  const campos = validarPasswordNueva(datos);
  if (Object.keys(campos).length) return { campos };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: datos.nueva });
  if (error) {
    return {
      error: "No pudimos cambiarla. Puede que el link haya vencido: pedí uno nuevo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
