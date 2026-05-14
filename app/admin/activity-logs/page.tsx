import type { Metadata } from "next";
import AdminActivityLogsPage from "@/components/admin/AdminActivityLogsPage";

export const metadata: Metadata = {
  title: "Activity Log – Admin Bia Hạ Long Procurement",
};

export default function Page() {
  return <AdminActivityLogsPage />;
}
