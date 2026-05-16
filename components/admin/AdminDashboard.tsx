"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { AdminTender } from "@/types/adminTender";
import { getAdminActivityLogs } from "@/services/activityStorage";
import { getAccounts } from "@/services/supplierAccountStorage";
import { getBids } from "@/services/supplierBidStorage";
import { getTenders } from "@/services/tenderStorage";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
} from "@/types/activityLog";
import type { ActivityEntityType, ActivityLog } from "@/types/activityLog";
import {
  FileText,
  CheckCircle,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Plus,
  Building2,
  BarChart2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { DashboardHero } from "@/components/admin/DashboardHero";

// ── helpers ───────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Gần đây";
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Vừa xong";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return "Gần đây"; }
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ ₫";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function formatDate(): string {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

// ── types ─────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalTenders:       number;
  openTenders:        number;
  pendingSuppliers:   number;
  newBids:            number;
  closingSoonTenders: number;
  totalTenderValue:   number;
}

interface ActivityItem {
  id:           string;
  type:         "supplier" | "bid" | "tender";
  title:        string;
  description?: string;
  actor?:       string;
  time:         string;
}

interface TaskItem {
  id:      string;
  label:   string;
  count:   number;
  href:    string;
  urgency: "high" | "medium" | "low";
}

// ── mock fallbacks ────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalTenders: 12, openTenders: 5, pendingSuppliers: 3,
  newBids: 8, closingSoonTenders: 2, totalTenderValue: 15_200_000_000,
};

const MOCK_TASKS: TaskItem[] = [
  { id: "1", label: "Nhà cung cấp chờ xét duyệt",       count: 3, href: "/admin/suppliers",      urgency: "high" },
  { id: "2", label: "Gói thầu sắp đóng (trong 3 ngày)", count: 2, href: "/admin/tenders",         urgency: "high" },
  { id: "3", label: "Báo giá mới chưa xem xét",          count: 8, href: "/admin/bids",            urgency: "medium" },
  { id: "4", label: "Gói thầu chưa có báo giá",          count: 1, href: "/admin/tenders",         urgency: "low" },
];

// ── stat card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  iconBg:   string;
  iconColor:string;
  href?:    string;
  note?:    string;
  noteColor?: string;
}

function StatCard({ label, value, icon, iconBg, iconColor, href, note, noteColor }: StatCardProps) {
  const inner = (
    <div className="stat-card p-5 flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[22px] font-bold text-slate-900 leading-none tracking-tight tabular-nums">
          {value}
        </div>
        <div className="text-[12.5px] text-slate-500 mt-1 leading-tight">{label}</div>
        {note && (
          <div className={`text-[11px] mt-1.5 font-medium ${noteColor ?? "text-slate-400"}`}>
            {note}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ── urgency style ─────────────────────────────────────────────────────────

function urgencyBadgeClass(u: TaskItem["urgency"]) {
  if (u === "high")   return "bg-red-50 text-red-600 border border-red-100 font-bold";
  if (u === "medium") return "bg-amber-50 text-amber-600 border border-amber-100 font-bold";
  return "bg-slate-100 text-slate-500 border border-slate-200 font-medium";
}

// ── activity helpers ──────────────────────────────────────────────────────

function entityTypeToItemType(e: ActivityEntityType): ActivityItem["type"] {
  if (e === "supplier") return "supplier";
  if (e === "bid")      return "bid";
  return "tender";
}

function logToActivityItem(log: ActivityLog): ActivityItem {
  return {
    id:          log.id,
    type:        entityTypeToItemType(log.entityType),
    title:       `${ACTIVITY_ACTION_LABELS[log.action]} ${ACTIVITY_ENTITY_LABELS[log.entityType]}`,
    description: log.description,
    actor:       [log.actorName, log.actorEmail].filter(Boolean).join(" · ") || undefined,
    time:        formatTime(log.createdAt),
  };
}

function activityDotColor(type: ActivityItem["type"]) {
  if (type === "supplier") return "bg-blue-400";
  if (type === "bid")      return "bg-purple-400";
  return "bg-emerald-400";
}

function activityIconBg(type: ActivityItem["type"]) {
  if (type === "supplier") return "bg-blue-50 text-blue-600";
  if (type === "bid")      return "bg-purple-50 text-purple-600";
  return "bg-emerald-50 text-emerald-600";
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  if (type === "supplier") return <Building2 className="w-3.5 h-3.5" />;
  if (type === "bid")      return <DollarSign className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

// ── quick actions ─────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "Tạo gói thầu",
    href:  "/admin/tenders/create",
    icon:  Plus,
    style: "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]",
    iconColor: "text-[var(--brand-accent)]",
  },
  {
    label: "NCC chờ duyệt",
    href:  "/admin/suppliers",
    icon:  Building2,
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50 hover:border-slate-300",
    iconColor: "text-amber-500",
  },
  {
    label: "Xem báo giá",
    href:  "/admin/bids",
    icon:  DollarSign,
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50 hover:border-slate-300",
    iconColor: "text-purple-500",
  },
  {
    label: "So sánh báo giá",
    href:  "/admin/bid-comparison",
    icon:  BarChart2,
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50 hover:border-slate-300",
    iconColor: "text-emerald-500",
  },
];

// ── main component ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats,               setStats]               = useState<DashboardStats>(MOCK_STATS);
  const [activities,          setActivities]          = useState<ActivityItem[]>([]);
  const [allActivities,       setAllActivities]       = useState<ActivityItem[]>([]);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [tasks,               setTasks]               = useState<TaskItem[]>(MOCK_TASKS);
  const [loading,             setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      const [suppliers, bids, tenders, logs] = await Promise.all([
        getAccounts(), getBids(), getTenders(), getAdminActivityLogs(),
      ]);

      function normalizeStatus(s: SupplierAccount): string {
        if (!s.profileCompleted) return "Chưa hoàn thiện";
        if (!s.status || s.status.trim() === "") return "Chờ xét duyệt";
        return s.status;
      }
      function getTenderValue(t: AdminTender & { value?: string }): number {
        if (typeof t.estimatedValue === "number") return t.estimatedValue;
        if (typeof t.value === "string") {
          const n = parseFloat(t.value.replace(/[^\d]/g, ""));
          return isNaN(n) ? 0 : n;
        }
        return 0;
      }

      const mappedLogs = logs.slice(0, 50).map(logToActivityItem);
      setAllActivities(mappedLogs);
      setActivities(mappedLogs.slice(0, 6));

      const hasData = suppliers.length > 0 || bids.length > 0 || tenders.length > 0;
      if (hasData) {
        const pending     = suppliers.filter(s => normalizeStatus(s) === "Chờ xét duyệt").length;
        const open        = tenders.filter(t => t.status === "Đang nhận báo giá").length;
        const closingSoon = tenders.filter(t => t.status === "Đã đóng").length;
        const totalValue  = tenders.reduce((acc, t) => acc + getTenderValue(t as AdminTender & { value?: string }), 0);

        setStats({
          totalTenders:       tenders.length  > 0 ? tenders.length  : MOCK_STATS.totalTenders,
          openTenders:        tenders.length  > 0 ? open            : MOCK_STATS.openTenders,
          pendingSuppliers:   pending,
          newBids:            bids.length     > 0 ? bids.filter(b => b.status === "Đã nộp").length : MOCK_STATS.newBids,
          closingSoonTenders: tenders.length  > 0 ? closingSoon     : MOCK_STATS.closingSoonTenders,
          totalTenderValue:   totalValue      > 0 ? totalValue       : MOCK_STATS.totalTenderValue,
        });

        setTasks(prev => prev.map(t => {
          if (t.id === "1") return { ...t, count: pending };
          if (t.id === "3") return { ...t, count: bids.length > 0 ? bids.filter(b => b.status === "Đã nộp").length : t.count };
          return t;
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">

      {/* ── Hero banner ────────────────────────────────────────────────── */}
      <DashboardHero
        openTenders={stats.openTenders}
        pendingSuppliers={stats.pendingSuppliers}
        totalTenderValue={loading ? "–" : formatCurrency(stats.totalTenderValue)}
        loading={loading}
      />

      {/* ── KPI stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Tổng gói thầu"
              value={stats.totalTenders}
              icon={<FileText className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-blue-50"
              iconColor="text-[var(--brand-primary)]"
              href="/admin/tenders"
            />
            <StatCard
              label="Đang nhận báo giá"
              value={stats.openTenders}
              icon={<CheckCircle className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              href="/admin/tenders"
              note="Gói thầu đang nhận báo giá"
              noteColor="text-emerald-500"
            />
            <StatCard
              label="NCC chờ duyệt"
              value={stats.pendingSuppliers}
              icon={<Users className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              href="/admin/suppliers"
              note={stats.pendingSuppliers > 0 ? "Cần xử lý" : "Không có"}
              noteColor={stats.pendingSuppliers > 0 ? "text-amber-500" : "text-slate-400"}
            />
            <StatCard
              label="Báo giá mới"
              value={stats.newBids}
              icon={<DollarSign className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              href="/admin/bids"
            />
            <StatCard
              label="Đã đóng"
              value={stats.closingSoonTenders}
              icon={<AlertTriangle className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              href="/admin/tenders"
              note={stats.closingSoonTenders > 0 ? "Trong 3 ngày tới" : ""}
              noteColor="text-red-400"
            />
            <StatCard
              label="Tổng giá trị"
              value={formatCurrency(stats.totalTenderValue)}
              icon={<TrendingUp className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-[var(--brand-accent-light)]"
              iconColor="text-[var(--brand-accent)]"
            />
          </>
        )}
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <section className="card p-5">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Thao tác nhanh</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${action.style}`}
              >
                <Icon className={`w-4 h-4 ${action.iconColor}`} strokeWidth={1.8} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Two-column: Activity + Tasks ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent activity */}
        <section className="card overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-[var(--border-muted)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <h3 className="text-[13.5px] font-semibold text-slate-800">Hoạt động gần đây</h3>
            </div>
            {allActivities.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowActivityHistory(true)}
                className="text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-accent)] transition-colors flex items-center gap-1"
              >
                Xem thêm <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-xs text-slate-400">Tự động cập nhật</span>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-slate-400">
              Chưa có hoạt động nào.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-muted)]">
              {activities.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activityIconBg(item.type)}`}>
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 leading-snug truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.actor && <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{item.actor}</span>}
                      <span className="text-[11px] text-slate-400">{item.time}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tasks */}
        <section className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border-muted)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
            <h3 className="text-[13.5px] font-semibold text-slate-800">Việc cần xử lý</h3>
          </div>
          <ul className="p-3 space-y-1">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs shrink-0 ${urgencyBadgeClass(task.urgency)}`}
                    >
                      {task.count}
                    </span>
                    <span className="text-[13px] text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                      {task.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 ml-2 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ── Activity history modal ──────────────────────────────────────── */}
      {showActivityHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl max-h-[82vh] bg-white rounded-2xl border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-muted)] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800">Lịch sử hoạt động</h3>
                <p className="text-xs text-slate-400 mt-0.5">50 hoạt động gần nhất.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityHistory(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {allActivities.length === 0 ? (
                <div className="py-12 text-sm text-center text-slate-400">Chưa có hoạt động nào.</div>
              ) : (
                <ul className="divide-y divide-[var(--border-muted)]">
                  {allActivities.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activityIconBg(item.type)}`}>
                        <ActivityIcon type={item.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        {item.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {item.actor && <span className="text-xs text-slate-400 truncate max-w-[160px]">{item.actor}</span>}
                          <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                      </div>
                    </li>
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
