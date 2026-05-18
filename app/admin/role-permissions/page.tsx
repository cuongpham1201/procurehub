import type { Metadata } from "next";
import RolePermissionsPage from "@/components/admin/RolePermissionsPage";

export const metadata: Metadata = {
  title: "Phân quyền vai trò – Admin Bia Hạ Long Procurement",
};

export default function Page() {
  return <RolePermissionsPage />;
}
