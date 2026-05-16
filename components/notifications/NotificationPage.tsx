"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import type { NotificationRow } from "@/lib/notifications/types";
import { NOTIFICATION_META } from "@/lib/notifications/types";
import { NotificationIcon } from "./NotificationIcon";
import { relativeTime, dateGroupLabel } from "./time-utils";

type FilterTab = "all" | "unread" | "supplier" | "tender" | "bid";

const TYPE_GROUPS: Record<Exclude<FilterTab, "all" | "unread">, string[]> = {
  supplier: ["SUPPLIER_REGISTERED", "SUPPLIER_APPROVED", "SUPPLIER_REJECTED", "SUPPLIER_DEACTIVATED", "SUPPLIER_NEED_MORE_INFO"],
  tender:   ["TENDER_CREATED", "TENDER_PUBLISHED", "TENDER_CLOSING_SOON", "TENDER_CLOSED", "TENDER_CANCELLED"],
  bid:      ["BID_SUBMITTED", "BID_AWARDED", "BID_REJECTED", "BID_NEED_MORE_INFO"],
};

const TAB_LABELS: Record<FilterTab, string> = {
  all:      "Tất cả",
  unread:   "Chưa đọc",
  supplier: "Hồ sơ NCC",
  tender:   "Gói thầu",
  bid:      "Báo giá",
};

export default function NotificationPage() {
  const router = useRouter();
  const [allItems,  setAllItems]  = useState<NotificationRow[]>([]);
  const [unread,    setUnread]    = useState(0);
  const [tab,       setTab]       = useState<FilterTab>("all");
  const [loading,   setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=100");
      if (res.status === 401) { router.replace("/login"); return; }
      if (!res.ok) return;
      const json = await res.json();
      setAllItems(json.data ?? []);
      setUnread(json.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Client-side filter
  const items = allItems.filter((n) => {
    if (tab === "unread") return !n.isRead;
    if (tab in TYPE_GROUPS) return TYPE_GROUPS[tab as keyof typeof TYPE_GROUPS].includes(n.type as string);
    return true;
  });

  async function handleItemClick(item: NotificationRow) {
    if (!item.isRead) {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setAllItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (item.link) router.push(item.link);
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setAllItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  /* ── group by date ─────────────────────────────────────────────────────── */
  const groups: { label: string; items: NotificationRow[] }[] = [];
  for (const item of items) {
    const label = dateGroupLabel(item.createdAt);
    const last  = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-subtle)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {unread > 0 ? `${unread} thông báo chưa đọc` : "Tất cả đã đọc"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-white rounded-xl border border-[var(--border-default)] p-1 mb-5 shadow-sm w-fit">
          {(["all", "unread", "supplier", "tender", "bid"] as FilterTab[]).map((t) => {
            const label = t === "unread" && unread > 0
              ? `Chưa đọc (${unread})`
              : TAB_LABELS[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  tab === t
                    ? "bg-[var(--brand-primary)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-sm py-16 text-center text-sm text-slate-400">
            Đang tải thông báo...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-sm py-20 text-center">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-slate-600 mb-1">
              {tab === "unread" ? "Không có thông báo chưa đọc" : `Không có thông báo nào${tab !== "all" ? ` (${TAB_LABELS[tab]})` : ""}`}
            </p>
            <p className="text-sm text-slate-400">
              {tab === "unread" ? "Bạn đã đọc tất cả thông báo." : "Hoạt động hệ thống sẽ xuất hiện ở đây."}
            </p>
            {tab !== "all" && (
              <button
                onClick={() => setTab("all")}
                className="mt-4 text-sm text-[var(--brand-primary)] font-medium hover:underline"
              >
                Xem tất cả thông báo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.label}>
                {/* Date group label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="bg-white rounded-2xl border border-[var(--border-default)] shadow-sm overflow-hidden">
                  {group.items.map((item, idx) => (
                    <PageNotificationItem
                      key={item.id}
                      item={item}
                      isLast={idx === group.items.length - 1}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── page item ───────────────────────────────────────────────────────────── */

function PageNotificationItem({
  item,
  isLast,
  onClick,
}: {
  item: NotificationRow;
  isLast: boolean;
  onClick: () => void;
}) {
  const meta = NOTIFICATION_META[item.type];
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-start gap-4 px-5 py-4 text-left transition-colors",
        isLast ? "" : "border-b border-[var(--border-muted)]",
        item.isRead ? "hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50/80",
      ].join(" ")}
    >
      <div className="shrink-0 mt-0.5">
        <NotificationIcon icon={meta.icon} color={meta.color} size="md" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-[13.5px] leading-snug ${item.isRead ? "text-slate-700" : "text-slate-900 font-semibold"}`}>
            {item.title}
          </p>
          <span className="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
            {relativeTime(item.createdAt)}
          </span>
        </div>
        <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">{item.message}</p>
        {item.link && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--brand-primary)]">
            Xem chi tiết →
          </span>
        )}
      </div>

      {!item.isRead && (
        <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-500 mt-2" />
      )}
    </button>
  );
}
