import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Quien entra a /admin. Sale de SUPERADMIN_IDS: uuids separados por coma, en
 * .env.local y en Vercel.
 *
 * ponytail: sin tabla de roles ni columna en perfiles. Los admins son uno o
 * dos y cambian nunca; una columna obligaria a revisar todas las policies de
 * RLS para que el rol no se filtre a ningun lado. Si algun dia hay que dar y
 * sacar admin sin deploy, ahi entra la columna.
 */
export const esAdmin = (
  uid: string | undefined | null,
  ids: string | undefined = process.env.SUPERADMIN_IDS,
): boolean =>
  !!uid &&
  (ids ?? "")
    .split(",")
    // toLowerCase porque un uuid copiado en mayusculas es el mismo uuid, y
    // Postgres siempre los devuelve en minuscula: sin esto la variable "bien
    // cargada" no matchea y el panel da 404 sin decir por que.
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(uid.toLowerCase());

/**
 * Gate del panel. Va en el layout Y al principio de cada server action: las
 * actions son endpoints POST propios, el layout no las cubre.
 *
 * notFound() y no redirect("/auth"): un usuario comun no tiene por que
 * enterarse de que la ruta existe. Por lo mismo /admin no esta en las PRIVADAS
 * de proxy.ts, que redirigirian al login y delatarian la seccion.
 */
export async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.id)) notFound();
  return user!;
}
