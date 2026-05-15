import type { Metadata } from "next";
import NotificationPage from "@/components/notifications/NotificationPage";

export const metadata: Metadata = {
  title: "Thông báo – Bia Hạ Long Procurement",
};

export default function NotificationsPage() {
  return <NotificationPage />;
}
