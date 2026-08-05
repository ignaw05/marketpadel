import { PublishScreen } from "@/components/screens/publish-screen";
import { listarMarcas } from "@/lib/paletas-db";

export default async function Page() {
  const marcas = await listarMarcas();
  return <PublishScreen marcas={marcas} />;
}
