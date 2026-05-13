import type { Metadata } from "next";
import RegisterAccountPage from "@/components/supplier/RegisterAccountPage";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản nhà cung cấp – Cổng đấu thầu Bia Hạ Long",
  description:
    "Tạo tài khoản nhà cung cấp trong 2 phút. Đăng ký để nhận yêu cầu báo giá từ Bia Hạ Long.",
};

export default function Page() {
  return <RegisterAccountPage />;
}
