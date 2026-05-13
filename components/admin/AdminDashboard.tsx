"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { SupplierBid } from "@/types/supplierBid";
import type { AdminTender } from "@/types/adminTender";
import { getAdminActivityLogs } from "@/services/activityStorage";
import type { ActivityLogType, AdminActivityLog } from "@/services/activityStorage";

// ── helpers ───────────────────────────────────────────────────────────────

function formatActivityTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Gần đây";
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Vừa xong";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    const day = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
  } catch { return "Gần đây"; }
}

function readLS<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

// ── types ─────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalTenders: number;
  openTenders: number;
  pendingSuppliers: number;
  newBids: number;
  closingSoonTenders: number;
  totalTenderValue: number;
}

interface ActivityItem {
  id: string;
  type: "supplier" | "bid" | "tender";
  title: string;
  description?: string;
  actor?: string;
  time: string;
}

interface TaskItem {
  id: string;
  label: string;
  count: number;
  href: string;
  urgency: "high" | "medium" | "low";
}

// ── mock fallbacks ────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalTenders: 12,
  openTenders: 5,
  pendingSuppliers: 3,
  newBids: 8,
  closingSoonTenders: 2,
  totalTenderValue: 15_200_000_000,
};

const MOCK_TASKS: TaskItem[] = [
  { id: "1", label: "Nhà cung cấp chờ xét duyệt", count: 3, href: "/admin/suppliers", urgency: "high" },
  { id: "2", label: "Gói thầu sắp hết hạn (trong 3 ngày)", count: 2, href: "/admin/tenders", urgency: "high" },
  { id: "3", label: "Báo giá mới chưa xem", count: 8, href: "/admin/bids", urgency: "medium" },
  { id: "4", label: "Gói thầu chưa có báo giá nào", count: 1, href: "/admin/tenders", urgency: "low" },
];

// ── icons ─────────────────────────────────────────────────────────────────

function IconTenderTotal() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconTenderOpen() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function IconSupplierPending() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBidNew() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconClosingSoon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
    </svg>
  );
}
function IconValue() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconActivitySupplier() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconActivityBid() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
function IconActivityTender() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href?: string;
}

function StatCard({ label, value, icon, iconBg, iconColor, href }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ── urgency badge ─────────────────────────────────────────────────────────

function urgencyClass(urgency: TaskItem["urgency"]) {
  if (urgency === "high") return "bg-red-100 text-red-700 border border-red-200";
  if (urgency === "medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function logTypeToItemType(t: ActivityLogType): ActivityItem["type"] {
  if (t === "supplier_profile") return "supplier";
  if (t === "bid_status" || t === "bid_deleted") return "bid";
  return "tender";
}

function logToActivityItem(log: AdminActivityLog): ActivityItem {
  return {
    id: log.id,
    type: logTypeToItemType(log.type),
    title: log.title,
    description: log.description,
    actor: [log.actorName, log.actorRole].filter(Boolean).join(" · ") || undefined,
    time: formatActivityTime(log.createdAt),
  };
}

// ── main component ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);

  useEffect(() => {
    // Read localStorage and compute real stats
    const suppliers = readLS<SupplierAccount>("procurehub_supplier_accounts");
    const bids = readLS<SupplierBid>("procurehub_supplier_bids");
    const tenders = readLS<AdminTender>("procurehub_admin_tenders");

    // Normalize NCC status: profileCompleted=false → "Chưa hoàn thiện",
    // profileCompleted=true + status rỗng → "Chờ xét duyệt", else dùng status
    function normalizeSupplierStatus(s: SupplierAccount): string {
      if (!s.profileCompleted) return "Chưa hoàn thiện";
      if (!s.status || s.status.trim() === "") return "Chờ xét duyệt";
      return s.status;
    }

    // Safe helper: extract numeric value from AdminTender
    function getTenderValue(t: AdminTender & { value?: string }): number {
      if (typeof t.estimatedValue === "number") return t.estimatedValue;
      if (typeof t.value === "string") {
        const num = parseFloat(t.value.replace(/[^\d]/g, ""));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    }

    const activityLogs = getAdminActivityLogs(); // already sorted DESC by createdAt
    const mappedLogs = activityLogs.slice(0, 50).map(logToActivityItem);
    setAllActivities(mappedLogs);
    setActivities(mappedLogs.slice(0, 5));

    const hasData = suppliers.length > 0 || bids.length > 0 || tenders.length > 0;

    if (hasData) {
      const pendingSuppliers = suppliers.filter(
        (s) => normalizeSupplierStatus(s) === "Chờ xét duyệt"
      ).length;
      const openTenders = tenders.filter((t) => t.status === "Đang mở").length;
      const closingSoon = tenders.filter((t) => t.status === "Sắp đóng").length;
      const totalValue = tenders.reduce(
        (acc, t) => acc + getTenderValue(t as AdminTender & { value?: string }),
        0
      );

      // Chỉ dùng MOCK_STATS cho tenders/bids (chưa có thật), KHÔNG dùng cho NCC
      setStats({
        totalTenders: tenders.length > 0 ? tenders.length : MOCK_STATS.totalTenders,
        openTenders: tenders.length > 0 ? openTenders : MOCK_STATS.openTenders,
        pendingSuppliers,  // số thật, không fallback
        newBids: bids.length > 0 ? bids.filter(b => b.status === "Đã nộp").length : MOCK_STATS.newBids,
        closingSoonTenders: tenders.length > 0 ? closingSoon : MOCK_STATS.closingSoonTenders,
        totalTenderValue: totalValue > 0 ? totalValue : MOCK_STATS.totalTenderValue,
      });

      // Cập nhật tasks với số thật
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === "1") return { ...t, count: pendingSuppliers };
          if (t.id === "3") return { ...t, count: bids.length > 0 ? bids.filter(b => b.status === "Đã nộp").length : t.count };
          return t;
        })
      );
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Tổng quan hệ thống</h2>
        <p className="text-sm text-slate-500 mt-1">Cổng quản trị mua sắm – Bia Hạ Long</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tổng gói thầu"
          value={stats.totalTenders}
          icon={<IconTenderTotal />}
          iconBg="bg-blue-50"
          iconColor="text-[#0f2d5e]"
          href="/admin/tenders"
        />
        <StatCard
          label="Gói đang mở"
          value={stats.openTenders}
          icon={<IconTenderOpen />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          href="/admin/tenders"
        />
        <StatCard
          label="NCC chờ xét duyệt"
          value={stats.pendingSuppliers}
          icon={<IconSupplierPending />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          href="/admin/suppliers"
        />
        <StatCard
          label="Báo giá mới"
          value={stats.newBids}
          icon={<IconBidNew />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          href="/admin/bids"
        />
        <StatCard
          label="Gói sắp đóng"
          value={stats.closingSoonTenders}
          icon={<IconClosingSoon />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          href="/admin/tenders"
        />
        <StatCard
          label="Tổng giá trị mời thầu"
          value={formatCurrency(stats.totalTenderValue)}
          icon={<IconValue />}
          iconBg="bg-[#fdf8ee]"
          iconColor="text-[#c9a227]"
        />
      </div>

      {/* Two-column row: Activity + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Hoạt động gần đây</h3>
            {allActivities.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowActivityHistory(true)}
                className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
              >
                Xem thêm lịch sử
              </button>
            ) : (
              <span className="text-xs text-slate-400">Cập nhật tự động</span>
            )}
          </div>
          {activities.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-400 text-center">
              Chưa có hoạt động quản trị nào.
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {activities.map((item) => (
                <ActivityListItem key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* Tasks */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Việc cần xử lý</h3>
          </div>
          <ul className="divide-y divide-slate-50 p-4 space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 ${urgencyClass(task.urgency)}`}
                    >
                      {task.count}
                    </span>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                      {task.label}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick actions */}
      <section>
        <h3 className="font-semibold text-slate-800 mb-3">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/tenders"
            className="flex flex-col items-center gap-2.5 p-5 bg-[#0f2d5e] text-white rounded-xl hover:bg-[#0d2550] transition-colors text-center"
          >
            <svg className="w-7 h-7 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Tạo gói thầu</span>
          </Link>
          <Link
            href="/admin/suppliers"
            className="flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
          >
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">NCC chờ duyệt</span>
          </Link>
          <Link
            href="/admin/bids"
            className="flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
          >
            <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span className="text-sm font-medium">Xem báo giá mới</span>
          </Link>
          <Link
            href="/"
            className="flex flex-col items-center gap-2.5 p-5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
          >
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="text-sm font-medium">Trang public</span>
          </Link>
        </div>
      </section>

      {showActivityHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">Lịch sử hoạt động quản trị</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hiển thị tối đa 50 hoạt động mới nhất.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityHistory(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng lịch sử hoạt động"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-76px)]">
              {allActivities.length === 0 ? (
                <div className="px-5 py-10 text-sm text-slate-400 text-center">
                  Chưa có hoạt động quản trị nào.
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {allActivities.map((item) => (
                    <ActivityListItem key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityListItem({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <div
        className={[
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          item.type === "supplier"
            ? "bg-blue-100 text-[#0f2d5e]"
            : item.type === "bid"
            ? "bg-purple-100 text-purple-600"
            : "bg-green-100 text-green-600",
        ].join(" ")}
      >
        {item.type === "supplier" ? (
          <IconActivitySupplier />
        ) : item.type === "bid" ? (
          <IconActivityBid />
        ) : (
          <IconActivityTender />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-sm text-slate-600 leading-snug mt-0.5">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {item.actor && <span className="text-xs text-slate-500">{item.actor}</span>}
          <span className="text-xs text-slate-400">{item.time}</span>
        </div>
      </div>
    </li>
  );
}
