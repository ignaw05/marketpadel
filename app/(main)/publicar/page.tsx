import { redirect } from "next/navigation";
import { PublishScreen } from "@/components/screens/publish-screen";
import { listarMarcas } from "@/lib/paletas-db";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Mejor rebotar antes que despues de llenar todo el formulario.
  if (!user) redirect("/auth");

  const marcas = await listarMarcas();
  return <PublishScreen marcas={marcas} userId={user.id} />;
}
