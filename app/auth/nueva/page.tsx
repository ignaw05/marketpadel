import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NuevaPasswordScreen } from "@/components/screens/auth-screen";

/** Segundo paso del reset. Solo se llega con la sesión que dejó el link del mail. */
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?error=link");

  return <NuevaPasswordScreen />;
}
