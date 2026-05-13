import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export const metadata: Metadata = {
  title: "Admin – Cổng quản trị Bia Hạ Long Procurement",
  description: "Cổng quản trị đấu thầu mua sắm nội bộ – Bia Hạ Long.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
