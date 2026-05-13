import type { Metadata } from "next";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Đăng nhập – Cổng đấu thầu Bia Hạ Long",
  description: "Đăng nhập vào hệ thống đấu thầu mua sắm Bia Hạ Long.",
};

export default function Page() {
  return <LoginPage />;
}
