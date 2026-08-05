import { MyListings } from "@/components/screens/my-listings";
import { listarMisPaletas } from "@/lib/paletas-db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ publicada?: string; pago?: string; editada?: string }>;
}) {
  const [paletas, { publicada, pago, editada }] = await Promise.all([
    listarMisPaletas(),
    searchParams,
  ]);
  return (
    <MyListings
      paletas={paletas}
      publicada={publicada === "1"}
      pago={pago}
      editada={editada === "1"}
    />
  );
}
