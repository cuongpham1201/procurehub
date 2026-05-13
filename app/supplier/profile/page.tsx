import type { Metadata } from "next";
import SupplierProfilePage from "@/components/supplier/SupplierProfilePage";

export const metadata: Metadata = {
  title: "Hồ sơ nhà cung cấp – Cổng đấu thầu Bia Hạ Long",
  description: "Hoàn thiện hồ sơ năng lực để được xét duyệt và nhận yêu cầu báo giá.",
};

export default function Page() {
  return <SupplierProfilePage />;
}
