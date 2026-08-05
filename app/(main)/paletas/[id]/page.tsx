import { notFound } from "next/navigation";
import { DetailView } from "@/components/detail-view";
import { ContarVisita } from "@/components/contar-visita";
import { obtenerPaleta } from "@/lib/paletas-db";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await obtenerPaleta(id);

  if (!resultado) notFound();

  return (
    <>
      <ContarVisita id={id} />
      <DetailView paleta={resultado.paleta} vendedor={resultado.vendedor} />
    </>
  );
}
