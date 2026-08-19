import { HistorialVentas } from "@/components/screens/historial-ventas";
import { listarMisVentas } from "@/lib/paletas-db";

export default async function Page() {
  const ventas = await listarMisVentas();
  return <HistorialVentas ventas={ventas} titulo="Mis ventas" />;
}
