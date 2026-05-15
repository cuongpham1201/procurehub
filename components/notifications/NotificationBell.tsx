"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import type { NotificationRow } from "@/lib/notifications/types";
import { NOTIFICATION_META } from "@/lib/notifications/types";
import { NotificationIcon } from "./NotificationIcon";
import { relativeTime } from "./time-utils";

interface Props {
  /** "admin" toolbar (dark ring avatar style) vs "supplier" (light bar) */
  variant?: "admin" | "supplier";
}

export default function NotificationBell({ variant = "admin" }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [items, setItems]         = useState<NotificationRow[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const dropRef                   = useRef<HTMLDivElement>(null);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch more than we display so we have enough after client-side dedup
      const res = await fetch("/api/notifications?limit=30");
      if (!res.ok) return;
      const json = await res.json();
      const raw: NotificationRow[] = json.data ?? [];
      // Dedupe by type+link: keep only the newest entry per (type, link) pair.
      // Unread items are sorted first so they win over read ones of the same key.
      const seen = new Map<string, NotificationRow>();
      const sorted = [...raw].sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      for (const item of sorted) {
        const key = `${item.type}::${item.link ?? ""}`;
        if (!seen.has(key)) seen.set(key, item);
      }
      setItems(Array.from(seen.values()).slice(0, 5));
      setUnread(json.unreadCount ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleItemClick(item: NotificationRow) {
    setOpen(false);
    if (!item.isRead) {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (item.link) router.push(item.link);
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  const btnCls = variant === "admin"
    ? "relative flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
    : "relative flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors";

  return (
    <div ref={dropRef} className="relative">
      <button
        title="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className={btnCls}
        aria-label="Mở thông báo"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl border border-[var(--border-default)] shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-muted)]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-800">Thông báo</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unread} chưa đọc
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List — max 5 deduped items, capped height */}
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Chưa có thông báo nào</p>
              </div>
            ) : (
              items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-muted)] px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-[12px] text-slate-500 hover:text-[var(--brand-primary)] font-medium transition-colors"
            >
              Xem tất cả thông báo
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── single item ─────────────────────────────────────────────────────────── */

function NotificationItem({
  item,
  onClick,
}: {
  item: NotificationRow;
  onClick: () => void;
}) {
  const meta = NOTIFICATION_META[item.type];
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-muted)] last:border-b-0",
        item.isRead
          ? "hover:bg-slate-50"
          : "bg-blue-50/60 hover:bg-blue-50",
      ].join(" ")}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <NotificationIcon icon={meta.icon} color={meta.color} size="sm" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[12.5px] leading-snug mb-0.5 ${item.isRead ? "text-slate-600" : "text-slate-800 font-semibold"}`}>
          {item.title}
        </p>
        <p className="text-[11.5px] text-slate-500 leading-snug line-clamp-2">{item.message}</p>
        <p className="text-[10.5px] text-slate-400 mt-1">{relativeTime(item.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!item.isRead && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
      )}
    </button>
  );
}
