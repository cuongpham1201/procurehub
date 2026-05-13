import type { Metadata } from "next";
import AdminTenderCreatePage from "@/components/admin/AdminTenderCreatePage";

export const metadata: Metadata = {
  title: "Tạo gói thầu – Admin Bia Hạ Long Procurement",
};

export default function Page() {
  return <AdminTenderCreatePage />;
}
