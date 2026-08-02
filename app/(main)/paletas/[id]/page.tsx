import { notFound } from "next/navigation";
import { DetailView } from "@/components/detail-view";
import { PALETAS, MIS_PALETAS } from "@/lib/paletas";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paleta = [...PALETAS, ...MIS_PALETAS].find((p) => p.id === id);

  if (!paleta) notFound();

  return <DetailView paleta={paleta} />;
}
