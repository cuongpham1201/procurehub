import type { Metadata } from "next";
import AdminSuppliersPage from "@/components/admin/AdminSuppliersPage";

export const metadata: Metadata = {
  title: "Quản lý nhà cung cấp – Admin Bia Hạ Long Procurement",
  description: "Theo dõi, xét duyệt và quản lý hồ sơ nhà cung cấp.",
};

export default function Page() {
  return <AdminSuppliersPage />;
}
