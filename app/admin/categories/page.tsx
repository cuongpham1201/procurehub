import type { Metadata } from "next";
import AdminCategoriesPage from "@/components/admin/AdminCategoriesPage";

export const metadata: Metadata = {
  title: "Nhóm mua sắm – Admin Bia Hạ Long Procurement",
};

export default function Page() {
  return <AdminCategoriesPage />;
}

