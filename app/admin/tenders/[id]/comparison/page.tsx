import type { Metadata } from "next";
import AdminTenderComparisonPage from "@/components/admin/AdminTenderComparisonPage";

export const metadata: Metadata = {
  title: "So sánh báo giá – Admin Bia Hạ Long Procurement",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTenderComparisonPage tenderId={id} />;
}
