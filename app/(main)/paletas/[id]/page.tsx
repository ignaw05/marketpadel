import { notFound } from "next/navigation";
import { DetailView } from "@/components/detail-view";
import { ContarVisita } from "@/components/contar-visita";
import { obtenerPaleta } from "@/lib/paletas-db";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [resultado, { data }] = await Promise.all([
    obtenerPaleta(id),
    supabase.auth.getUser(),
  ]);

  if (!resultado) notFound();

  return (
    <>
      <ContarVisita id={id} />
      <DetailView
        paleta={resultado.paleta}
        vendedor={resultado.vendedor}
        esDueno={data.user?.id === resultado.paleta.vendedor_id}
      />
    </>
  );
}
