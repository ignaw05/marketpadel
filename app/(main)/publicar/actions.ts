"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validarPaleta, type CampoPaleta, type Errores } from "@/lib/validar";

export type PublicarState = {
  error?: string;
  campos?: Errores<CampoPaleta>;
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

  // Los valores no vuelven: el form los tiene en estado de React, que el
  // reset del <form> no toca.
  const campos = validarPaleta(datos);
  if (Object.keys(campos).length) return { campos };

  // Si la marca no esta en el catalogo, se crea: asi la proxima persona que
  // publique o filtre por ella ya la encuentra en las sugerencias.
  const { data: marcaId, error: errorMarca } = await supabase.rpc("marca_id_para", {
    p_nombre: datos.marca,
  });
  if (errorMarca || !marcaId) {
    return { error: "No pudimos guardar esa marca. Probá de nuevo." };
  }

  // El id vuelve en la URL: la pantalla de Mis paletas abre sola la invitacion a
  // promocionar sobre la paleta recien publicada.
  const { data: nueva, error } = await supabase.from("paletas").insert({
    vendedor_id: user.id,
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
  }).select("id").single();

  if (error) {
    return { error: "No pudimos publicar la paleta. Probá de nuevo." };
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  redirect(`/mis-publicaciones?publicada=${nueva.id}`);
}
