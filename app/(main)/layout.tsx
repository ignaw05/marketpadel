import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, apellido")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Suspense fallback={null}>
        <Header nombre={perfil?.nombre ?? ""} apellido={perfil?.apellido ?? ""} />
      </Suspense>
      {children}
    </>
  );
}
