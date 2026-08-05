"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validarPaleta, type CampoPaleta, type Errores } from "@/lib/validar";

export type PublicarState = {
  error?: string;
  campos?: Errores<CampoPaleta>;
  valores?: Record<string, string>;
};

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function publicar(
  _prev: PublicarState,
  fd: FormData,
): Promise<PublicarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Las fotos ya las subio el navegador al storage: aca llegan solo las URLs,
  // y solo valen las de la carpeta de este usuario en nuestro bucket.
  const prefijo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paletas/${user.id}/`;
  const fotos = fd
    .getAll("fotos")
    .map(String)
    .filter((u) => u.startsWith(prefijo));

  const datos = {
    marca_id: Number(texto(fd, "marca_id")),
    modelo: texto(fd, "modelo"),
    forma: texto(fd, "forma"),
    anio: Number(texto(fd, "anio")),
    estado: Number(texto(fd, "estado")),
    precio: Number(texto(fd, "precio").replace(/\D/g, "")),
    provincia: texto(fd, "provincia"),
    ciudad: texto(fd, "ciudad"),
    descripcion: texto(fd, "descripcion"),
    fotos,
  };

  const valores = {
    marca_id: String(datos.marca_id || ""),
    modelo: datos.modelo,
    forma: datos.forma,
    anio: String(datos.anio || ""),
    estado: String(datos.estado || ""),
    precio: String(datos.precio || ""),
    provincia: datos.provincia,
    ciudad: datos.ciudad,
    descripcion: datos.descripcion,
  };

  const campos = validarPaleta(datos);
  if (Object.keys(campos).length) return { campos, valores };

  const { error } = await supabase.from("paletas").insert({
    vendedor_id: user.id,
    marca_id: datos.marca_id,
    modelo: datos.modelo,
    forma: datos.forma,
    anio: datos.anio,
    estado: datos.estado,
    precio: datos.precio,
    provincia: datos.provincia,
    ciudad: datos.ciudad,
    descripcion: datos.descripcion,
    fotos: datos.fotos,
  });

  if (error) {
    return { error: "No pudimos publicar la paleta. Probá de nuevo.", valores };
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?publicada=1");
}
