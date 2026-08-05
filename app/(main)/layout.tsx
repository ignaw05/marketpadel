import { Suspense } from "react";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const perfil = user
    ? (
        await supabase
          .from("perfiles")
          .select("nombre, apellido")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  return (
    <>
      <Suspense fallback={null}>
        <Header
          usuario={user ? { nombre: perfil?.nombre ?? "", apellido: perfil?.apellido ?? "" } : null}
        />
      </Suspense>
      {children}
    </>
  );
}
