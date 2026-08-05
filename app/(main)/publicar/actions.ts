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

  const archivos = fd
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

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
    fotos: archivos.map((f) => ({ tipo: f.type, bytes: f.size })),
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

  // Storage: la policy exige que la carpeta sea el uid del que sube.
  const urls: string[] = [];
  for (const f of archivos) {
    const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const ruta = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("paletas")
      .upload(ruta, f, { contentType: f.type, upsert: false });

    if (error) {
      return { error: "No pudimos subir las fotos. Probá de nuevo.", valores };
    }

    urls.push(supabase.storage.from("paletas").getPublicUrl(ruta).data.publicUrl);
  }

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
    fotos: urls,
  });

  if (error) {
    return { error: "No pudimos publicar la paleta. Probá de nuevo.", valores };
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  redirect("/mis-publicaciones?publicada=1");
}
