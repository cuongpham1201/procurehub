import type { Metadata } from "next";
import AdminTendersPage from "@/components/admin/AdminTendersPage";

export const metadata: Metadata = {
  title: "Quản lý gói thầu – Admin Bia Hạ Long Procurement",
  description: "Tạo, phát hành và theo dõi các gói thầu mua sắm.",
};

export default function Page() {
  return <AdminTendersPage />;
}
