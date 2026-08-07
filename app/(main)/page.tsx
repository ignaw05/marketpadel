import { HomeScreen } from "@/components/screens/home-screen";
import { listarPaletas, listarMarcas, listarCiudades } from "@/lib/paletas-db";
import { paginaActual, type FiltrosFeed } from "@/lib/paletas";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltrosFeed>;
}) {
  const filtros = await searchParams;

  const [{ paletas, hayMas }, marcas, ciudades] = await Promise.all([
    listarPaletas(filtros),
    listarMarcas(),
    listarCiudades(),
  ]);

  return (
    <HomeScreen
      paletas={paletas}
      marcas={marcas.map((m) => m.nombre)}
      ciudades={ciudades}
      filtros={filtros}
      pagina={paginaActual(filtros.pagina)}
      hayMas={hayMas}
    />
  );
}
