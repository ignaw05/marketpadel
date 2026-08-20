import { redirect } from "next/navigation";
import { CuentaScreen } from "@/components/screens/cuenta-screen";
import { PlanPro } from "@/components/plan-pro";
import { createClient } from "@/lib/supabase/server";
import { miPlan } from "@/lib/pro-db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pro?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/cuenta");

  const [{ data: perfil }, plan, { pro }] = await Promise.all([
    supabase.from("perfiles").select("nombre, apellido, whatsapp").eq("id", user.id).maybeSingle(),
    miPlan(),
    searchParams,
  ]);

  return (
    <CuentaScreen
      email={user.email ?? ""}
      perfil={{
        nombre: perfil?.nombre ?? "",
        apellido: perfil?.apellido ?? "",
        whatsapp: perfil?.whatsapp ?? "",
      }}
      plan={<PlanPro plan={plan} pago={pro} />}
    />
  );
}
