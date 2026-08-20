import { MyListings } from "@/components/screens/my-listings";
import { listarMisPaletas } from "@/lib/paletas-db";
import { miPlan } from "@/lib/pro-db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    publicada?: string;
    pago?: string;
    editada?: string;
    donacion?: string;
    credito?: string;
  }>;
}) {
  const [paletas, plan, { publicada, pago, editada, donacion, credito }] = await Promise.all([
    listarMisPaletas(),
    miPlan(),
    searchParams,
  ]);
  return (
    <MyListings
      paletas={paletas}
      publicada={publicada}
      pago={pago}
      editada={editada === "1"}
      donacion={donacion}
      credito={credito}
      plan={plan}
    />
  );
}
