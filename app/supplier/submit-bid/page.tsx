import { Suspense } from "react";
import type { Metadata } from "next";
import SubmitBidPage from "@/components/supplier/SubmitBidPage";

export const metadata: Metadata = {
  title: "Nộp báo giá – Cổng đấu thầu Bia Hạ Long",
  description: "Nộp báo giá cho gói thầu mua sắm của Bia Hạ Long.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Đang tải...</p>
        </div>
      }
    >
      <SubmitBidPage />
    </Suspense>
  );
}
