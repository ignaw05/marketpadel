"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = localStorage.getItem("mp_auth") === "1";
    if (!ok) {
      router.replace("/auth");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage no existe en SSR, hace falta un efecto para sincronizar el primer render de cliente
      setAutenticado(true);
    }
  }, [router]);

  if (!autenticado) return null;

  return <>{children}</>;
}
