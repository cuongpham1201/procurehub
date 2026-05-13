import type { Metadata } from "next";
import SupplierDashboardPage from "@/components/supplier/SupplierDashboardPage";

export const metadata: Metadata = {
  title: "Portal nhà cung cấp – Cổng đấu thầu Bia Hạ Long",
  description: "Quản lý hồ sơ, theo dõi gói thầu và báo giá trên Portal nhà cung cấp Bia Hạ Long.",
};

export default function Page() {
  return <SupplierDashboardPage />;
}
