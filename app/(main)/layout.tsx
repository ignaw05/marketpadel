import { Suspense } from "react";
import Link from "next/link";
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

      <footer className="mt-10" style={{ borderTop: "1px solid #E6E4DF" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6">
          <p className="text-[13px] leading-relaxed" style={{ color: "#5B6470" }}>
            Paletita solo conecta compradores y vendedores. No participamos de las operaciones ni
            somos responsables por ellas.
          </p>
          <Link
            href="/terminos"
            className="mt-1 inline-flex min-h-[44px] items-center text-[13px] underline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "#057305", fontWeight: 600, outlineColor: "#057305" }}
          >
            Términos y condiciones
          </Link>
        </div>
      </footer>
    </>
  );
}
