"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validarPaleta } from "@/lib/validar";
import type { PublicarState } from "@/app/(main)/publicar/actions";

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function actualizar(
  id: string,
  _prev: PublicarState,
  fd: FormData,
): Promise<PublicarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Las fotos nuevas ya las subio el navegador al storage: aca llegan las URLs,
  // sean nuevas o de las que ya tenia la publicacion.
  const prefijo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paletas/${user.id}/`;
  const fotos = fd
    .getAll("fotos")
    .map(String)
    .filter((u) => u.startsWith(prefijo));

  const datos = {
    marca: texto(fd, "marca"),
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

  const campos = validarPaleta(datos);
  if (Object.keys(campos).length) return { campos };

  const { data: marcaId, error: errorMarca } = await supabase.rpc("marca_id_para", {
    p_nombre: datos.marca,
  });
  if (errorMarca || !marcaId) {
    return { error: "No pudimos guardar esa marca. Probá de nuevo." };
  }

  const { error } = await supabase
    .from("paletas")
    .update({
      marca_id: marcaId,
      modelo: datos.modelo,
      forma: datos.forma,
      anio: datos.anio,
      estado: datos.estado,
      precio: datos.precio,
      provincia: datos.provincia,
      ciudad: datos.ciudad,
      descripcion: datos.descripcion,
      fotos: datos.fotos,
    })
    .eq("id", id)
    .eq("vendedor_id", user.id);

  if (error) {
    return { error: "No pudimos guardar los cambios. Probá de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  revalidatePath(`/paletas/${id}`);
  redirect("/mis-publicaciones?editada=1");
}
