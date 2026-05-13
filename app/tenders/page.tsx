import type { Metadata } from "next";
import { Suspense } from "react";
import TenderListPage from "@/components/tender/TenderListPage";

export const metadata: Metadata = {
  title: "Danh sách gói thầu – Cổng đấu thầu Bia Hạ Long",
  description:
    "Tra cứu các gói thầu mua sắm nguyên vật liệu, máy móc, thiết bị, công cụ dụng cụ và dịch vụ của Bia Hạ Long.",
};

export default function TendersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Đang tải...</div>}>
      <TenderListPage />
    </Suspense>
  );
}
