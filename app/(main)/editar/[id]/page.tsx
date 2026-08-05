import { notFound, redirect } from "next/navigation";
import { PublishScreen } from "@/components/screens/publish-screen";
import { listarMarcas, obtenerMiPaleta } from "@/lib/paletas-db";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [marcas, paleta] = await Promise.all([listarMarcas(), obtenerMiPaleta(id)]);
  if (!paleta) notFound();

  return <PublishScreen marcas={marcas} userId={user.id} paleta={paleta} />;
}
