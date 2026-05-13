import type { Metadata } from "next";
import SupplierBidsPage from "@/components/supplier/SupplierBidsPage";

export const metadata: Metadata = {
  title: "Báo giá đã nộp – Supplier Portal Bia Hạ Long",
};

export default function Page() {
  return <SupplierBidsPage />;
}
