import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Tổng quan – Admin Bia Hạ Long Procurement",
  description: "Tổng quan hệ thống đấu thầu – Cổng quản trị Bia Hạ Long.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
