import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "muted"
  | "accent"
  | "purple";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-red-600 border-red-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-orange-50 text-orange-700 border-orange-200",
  muted:   "bg-slate-50 text-slate-500 border-slate-100",
  accent:  "bg-[#fdf8ee] text-[#a07a18] border-amber-200",
  purple:  "bg-purple-50 text-purple-700 border-purple-200",
};

export function Badge({
  children,
  variant = "default",
  dot,
  className = "",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        "badge",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={[
            "inline-block w-1.5 h-1.5 rounded-full shrink-0",
            variant === "success" ? "bg-green-500" :
            variant === "warning" ? "bg-amber-500" :
            variant === "danger"  ? "bg-red-500" :
            variant === "info"    ? "bg-blue-500" :
            variant === "pending" ? "bg-orange-500" :
            variant === "purple"  ? "bg-purple-500" :
            variant === "accent"  ? "bg-[#c9a227]" :
            "bg-slate-400",
          ].join(" ")}
        />
      )}
      {children}
    </span>
  );
}

/* ── Tender status → badge variant mapping ──────────────────────────────── */

export function TenderStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Nháp":           "muted",
    "Đang nhận báo giá":        "success",
    "Đã đóng":        "default",
    "Đang đánh giá":  "info",
    "Đã có kết quả":  "accent",
    "Đã hủy":         "danger",
  };
  return <Badge variant={map[status] ?? "default"} dot>{status}</Badge>;
}

/* ── Supplier status → badge variant mapping ────────────────────────────── */

export function SupplierStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Chưa hoàn thiện":  "muted",
    "Chờ xét duyệt":    "pending",
    "Đã duyệt":         "success",
    "Yêu cầu bổ sung":  "warning",
    "Từ chối":          "danger",
  };
  return <Badge variant={map[status] ?? "default"} dot>{status}</Badge>;
}

/* ── Bid status → badge variant mapping ─────────────────────────────────── */

export function BidStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    "Đã nộp":           "info",
    "Đang xem xét":      "pending",
    "Cần làm rõ":      "warning",
    "Được chọn":        "success",
    "Không được chọn":  "danger",
  };
  return <Badge variant={map[status] ?? "default"} dot>{status}</Badge>;
}
