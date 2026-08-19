import { HistorialVentas } from "@/components/screens/historial-ventas";
import { listarVentasGlobales } from "@/lib/paletas-db";

export default async function Page() {
  const ventas = await listarVentasGlobales();
  return (
    <HistorialVentas
      ventas={ventas}
      subtitulo="Lo que se vendió entre jugadores en Paletita, de lo más reciente a lo más antiguo."
      vacioTitulo="Todavía no se vendió nada"
      vacioTexto="Cuando se cierre la primera venta, va a aparecer acá."
    />
  );
}
