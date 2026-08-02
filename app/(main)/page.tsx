import { HomeScreen } from "@/components/screens/home-screen";
import { PALETAS } from "@/lib/paletas";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <HomeScreen paletas={PALETAS} query={q ?? ""} />;
}
