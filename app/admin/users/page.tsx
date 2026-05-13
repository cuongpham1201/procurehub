import type { Metadata } from "next";
import AdminUsersPage from "@/components/admin/AdminUsersPage";

export const metadata: Metadata = {
  title: "Người dùng nội bộ – Admin Bia Hạ Long Procurement",
};

export default function Page() {
  return <AdminUsersPage />;
}
