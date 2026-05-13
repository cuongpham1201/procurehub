import type { Metadata } from "next";
import AdminSupplierDetailPage from "@/components/admin/AdminSupplierDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết nhà cung cấp – Admin Bia Hạ Long Procurement",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminSupplierDetailPage id={id} />;
}
