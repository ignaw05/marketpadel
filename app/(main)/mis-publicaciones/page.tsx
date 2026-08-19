import { MyListings } from "@/components/screens/my-listings";
import { listarMisPaletas } from "@/lib/paletas-db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    publicada?: string;
    pago?: string;
    editada?: string;
    donacion?: string;
  }>;
}) {
  const [paletas, { publicada, pago, editada, donacion }] = await Promise.all([
    listarMisPaletas(),
    searchParams,
  ]);
  return (
    <MyListings
      paletas={paletas}
      publicada={publicada}
      pago={pago}
      editada={editada === "1"}
      donacion={donacion}
    />
  );
}
