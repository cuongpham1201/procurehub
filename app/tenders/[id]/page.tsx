import type { Metadata } from "next";
import TenderDetailLoader from "@/components/tender/TenderDetailLoader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Gói thầu ${id} | Cổng đấu thầu Bia Hạ Long`,
    description: "Chi tiết gói thầu trên Cổng đấu thầu Bia Hạ Long.",
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
