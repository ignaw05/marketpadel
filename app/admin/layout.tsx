import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exigirAdmin } from "@/lib/admin";
import { NavAdmin } from "@/components/admin/nav-admin";

export const metadata = {
  title: "Panel",
  // No es una pantalla publica; que no la indexe nadie.
  robots: { index: false, follow: false },
};

/**
 * El gate esta aca Y en cada server action de actions.ts: el layout protege lo
 * que se ve, no lo que se ejecuta.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirAdmin();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Panel</h1>
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-1.5 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "#5B6470", outlineColor: "#0F5132" }}
        >
          <ArrowLeft size={16} aria-hidden /> Volver al sitio
        </Link>
      </div>

      <div className="mt-4">
        <NavAdmin />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
