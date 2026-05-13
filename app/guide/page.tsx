import type { Metadata } from "next";
import GuidePage from "@/components/guide/GuidePage";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng – ProcureHub Bia Hạ Long",
  description:
    "Hướng dẫn thao tác theo từng vai trò trong hệ thống đấu thầu và mua sắm Bia Hạ Long.",
};

export default function Page() {
  return <GuidePage />;
}

