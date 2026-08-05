import { redirect } from "next/navigation";
import { CuentaScreen } from "@/components/screens/cuenta-screen";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/cuenta");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, apellido, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <CuentaScreen
      email={user.email ?? ""}
      perfil={{
        nombre: perfil?.nombre ?? "",
        apellido: perfil?.apellido ?? "",
        whatsapp: perfil?.whatsapp ?? "",
      }}
    />
  );
}
