import { MyListings } from "@/components/screens/my-listings";
import { listarMisPaletas } from "@/lib/paletas-db";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ publicada?: string }>;
}) {
  const [paletas, { publicada }] = await Promise.all([listarMisPaletas(), searchParams]);
  return <MyListings paletas={paletas} publicada={publicada === "1"} />;
}
