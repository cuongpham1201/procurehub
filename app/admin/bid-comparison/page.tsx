// Standalone comparison flow đã được thay thế bởi contextual per-line-item comparison.
// Truy cập qua: Admin → Gói thầu → [Chọn gói thầu] → So sánh báo giá
import { redirect } from "next/navigation";

export default function BidComparisonRedirect() {
  redirect("/admin/tenders");
}
