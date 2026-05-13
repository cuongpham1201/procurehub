import type { Metadata } from "next";
import AdminTenderDetailPage from "@/components/admin/AdminTenderDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết gói thầu – Admin Bia Hạ Long Procurement",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTenderDetailPage id={id} />;
}
