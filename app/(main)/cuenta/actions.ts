"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validarPerfil,
  validarPassword,
  type CampoPerfil,
  type CampoPassword,
  type Errores,
} from "@/lib/validar";

export type PerfilState = {
  error?: string;
  campos?: Errores<CampoPerfil>;
  valores?: { nombre: string; apellido: string; whatsapp: string };
  aviso?: string;
};

export type PasswordState = {
  error?: string;
  campos?: Errores<CampoPassword>;
  aviso?: string;
};

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function guardarPerfil(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const valores = {
    nombre: texto(formData, "nombre"),
    apellido: texto(formData, "apellido"),
    whatsapp: texto(formData, "whatsapp"),
  };

  const campos = validarPerfil(valores);
  if (Object.keys(campos).length) return { campos, valores };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Se cerró tu sesión. Ingresá de nuevo.", valores };

  // El id sale de la sesion, nunca del form. La RLS igual solo deja el propio.
  const { error } = await supabase.from("perfiles").update(valores).eq("id", user.id);
  if (error) return { error: "No pudimos guardar los cambios. Probá de nuevo.", valores };

  revalidatePath("/", "layout");
  return { aviso: "Listo, guardamos tus datos.", valores };
}

export async function cambiarPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const datos = {
    actual: String(formData.get("actual") ?? ""),
    nueva: String(formData.get("nueva") ?? ""),
    repetir: String(formData.get("repetir") ?? ""),
  };

  const campos = validarPassword(datos);
  if (Object.keys(campos).length) return { campos };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Se cerró tu sesión. Ingresá de nuevo." };

  // Reverificamos la actual: con la sesion sola, cualquiera que agarre el
  // dispositivo abierto se queda con la cuenta.
  const { error: malaActual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: datos.actual,
  });
  if (malaActual) return { campos: { actual: "Esa no es tu contraseña actual." } };

  const { error } = await supabase.auth.updateUser({ password: datos.nueva });
  if (error) return { error: "No pudimos cambiar la contraseña. Probá de nuevo." };

  return { aviso: "Listo, cambiamos tu contraseña." };
}
