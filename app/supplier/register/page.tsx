import type { Metadata } from "next";
import SupplierRegisterPage from "@/components/supplier/SupplierRegisterPage";

export const metadata: Metadata = {
  title: "Đăng ký nhà cung cấp – Cổng đấu thầu Bia Hạ Long",
  description:
    "Gửi thông tin doanh nghiệp để tham gia hệ thống đấu thầu và mua sắm của Bia Hạ Long.",
};

export default function Page() {
  return <SupplierRegisterPage />;
}
