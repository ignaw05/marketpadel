"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validarAuth, type CampoAuth, type Errores } from "@/lib/validar";

export type AuthState = {
  error?: string;
  campos?: Errores<CampoAuth>;
  valores?: Record<string, string>;
};

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function autenticar(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const modo = texto(formData, "modo") === "registro" ? "registro" : "login";
  const email = texto(formData, "email");
  const password = String(formData.get("password") ?? "");
  const nombre = texto(formData, "nombre");
  const apellido = texto(formData, "apellido");
  const whatsapp = texto(formData, "whatsapp");

  const valores = { email, nombre, apellido, whatsapp };

  const campos = validarAuth({ email, password, nombre, apellido }, modo);
  if (Object.keys(campos).length) return { campos, valores };

  const supabase = await createClient();

  if (modo === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
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
      options: { data: { nombre, apellido, whatsapp: whatsapp || null } },
    });

    if (error) {
      return {
        error:
          error.code === "user_already_exists"
            ? "Ya existe una cuenta con ese email. Ingresá."
            : "No pudimos crear la cuenta. Probá de nuevo en un momento.",
        valores,
      };
    }

    // Pasa si el proyecto todavia pide confirmar el mail.
    if (!data.session) {
      return {
        error: "Te mandamos un mail para confirmar la cuenta. Confirmala y después ingresá.",
        valores,
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}
