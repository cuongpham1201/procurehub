import type { Metadata } from "next";
import { tenders } from "@/data/tenders";
import TenderDetailLoader from "@/components/tender/TenderDetailLoader";

// Dùng mock IDs để pre-generate static routes — nội dung thật đọc từ localStorage
export function generateStaticParams() {
  return tenders.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tender = tenders.find((t) => t.id === id || t.code === id);
  if (!tender) return { title: "Gói thầu | Cổng đấu thầu Bia Hạ Long" };
  return {
    title: `${tender.code} – ${tender.name} | Cổng đấu thầu Bia Hạ Long`,
    description: tender.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenderDetailLoader id={id} />;
}
