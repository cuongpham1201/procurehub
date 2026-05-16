"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
} from "@/types/activityLog";
import type { ActivityEntityType, ActivityLog } from "@/types/activityLog";
import type { DashboardStats, MonthlyTrend } from "@/lib/repositories/procurehub";
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
  Clock,
  Award,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { DashboardHero } from "@/components/admin/DashboardHero";

// ── helpers ───────────────────────────────────────────────────────────────────

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
  if (!n) return "0 ₫";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + " tỷ ₫";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

// ── types ─────────────────────────────────────────────────────────────────────

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

// ── stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:      string;
  value:      string | number;
  icon:       React.ReactNode;
  iconBg:     string;
  iconColor:  string;
  href?:      string;
  note?:      string;
  noteColor?: string;
}

function StatCard({ label, value, icon, iconBg, iconColor, href, note, noteColor }: StatCardProps) {
  const inner = (
    <div className="stat-card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[22px] font-bold text-slate-900 leading-none tracking-tight tabular-nums">
          {value}
        </div>
        <div className="text-[12.5px] text-slate-500 mt-1 leading-tight">{label}</div>
        {note && (
          <div className={`text-[11px] mt-1.5 font-medium ${noteColor ?? "text-slate-400"}`}>{note}</div>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block group">{inner}</Link> : inner;
}

// ── trend chart (pure SVG, no library) ───────────────────────────────────────

function TrendChart({ data }: { data: MonthlyTrend[] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => Math.max(d.tenders, d.bids)), 1);
  const W = 480, H = 72, barGroupW = W / data.length;
  const barW  = Math.max(6, barGroupW / 2 - 6);
  const gap   = 2;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#0f2d5e] inline-block" />
          Gói thầu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#c9a227] inline-block" />
          Báo giá
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full overflow-visible">
        {data.map((d, i) => {
          const x     = i * barGroupW + barGroupW / 2 - barW - gap / 2;
          const tH    = Math.round((d.tenders / maxVal) * H);
          const bH    = Math.round((d.bids    / maxVal) * H);
          return (
            <g key={d.month}>
              <title>{d.label}: {d.tenders} gói thầu, {d.bids} báo giá</title>
              {/* tender bar */}
              <rect x={x} y={H - tH} width={barW} height={tH || 2}
                fill="#0f2d5e" rx="2" className="opacity-80 hover:opacity-100 transition-opacity" />
              {/* bid bar */}
              <rect x={x + barW + gap} y={H - bH} width={barW} height={bH || 2}
                fill="#c9a227" rx="2" className="opacity-80 hover:opacity-100 transition-opacity" />
              {/* label */}
              <text x={x + barW + gap / 2} y={H + 13} textAnchor="middle"
                fontSize="9" fill="#94a3b8">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── urgency badge ─────────────────────────────────────────────────────────────

function urgencyBadgeClass(u: TaskItem["urgency"]) {
  if (u === "high")   return "bg-red-50 text-red-600 border border-red-100 font-bold";
  if (u === "medium") return "bg-amber-50 text-amber-600 border border-amber-100 font-bold";
  return "bg-slate-100 text-slate-500 border border-slate-200 font-medium";
}

// ── activity helpers ──────────────────────────────────────────────────────────

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

// ── quick actions ─────────────────────────────────────────────────────────────

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
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50",
    iconColor: "text-amber-500",
  },
  {
    label: "Xem báo giá",
    href:  "/admin/bids",
    icon:  DollarSign,
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50",
    iconColor: "text-purple-500",
  },
  {
    label: "Gói thầu",
    href:  "/admin/tenders",
    icon:  FileText,
    style: "bg-white text-slate-700 border border-[var(--border-default)] hover:bg-slate-50",
    iconColor: "text-emerald-500",
  },
];

// ── main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats,               setStats]               = useState<DashboardStats | null>(null);
  const [trends,              setTrends]              = useState<MonthlyTrend[]>([]);
  const [activities,          setActivities]          = useState<ActivityItem[]>([]);
  const [allActivities,       setAllActivities]       = useState<ActivityItem[]>([]);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [tasks,               setTasks]               = useState<TaskItem[]>([]);
  const [loading,             setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Load failed");

        const s: DashboardStats   = json.data.stats;
        const t: MonthlyTrend[]   = json.data.trends ?? [];
        const a: ActivityLog[]    = json.data.activities ?? [];

        setStats(s);
        setTrends(t);

        const mapped = a.map(logToActivityItem);
        setAllActivities(mapped);
        setActivities(mapped.slice(0, 6));

        setTasks([
          {
            id: "pending_suppliers", urgency: s.pendingSuppliers > 0 ? "high" : "low",
            label: "Nhà cung cấp chờ xét duyệt",
            count: s.pendingSuppliers, href: "/admin/suppliers",
          },
          {
            id: "new_bids", urgency: s.newBids > 0 ? "medium" : "low",
            label: "Báo giá mới chưa xem xét",
            count: s.newBids, href: "/admin/bids",
          },
          {
            id: "closed_tenders", urgency: s.closedTenders > 0 ? "medium" : "low",
            label: "Gói thầu đã đóng chờ đánh giá",
            count: s.closedTenders, href: "/admin/tenders",
          },
          {
            id: "pending_approval", urgency: s.pendingApprovalTenders > 0 ? "high" : "low",
            label: "Gói thầu chờ phê duyệt kết quả",
            count: s.pendingApprovalTenders, href: "/admin/tenders",
          },
        ]);
      } catch {
        /* keep loading state, show empty */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const s = stats;

  return (
    <div className="space-y-6">

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <DashboardHero
        openTenders={s?.openTenders ?? 0}
        pendingSuppliers={s?.pendingSuppliers ?? 0}
        totalTenderValue={loading ? "–" : formatCurrency(s?.totalTenderValue ?? 0)}
        loading={loading}
      />

      {/* ── KPI stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Tổng gói thầu"
              value={s?.totalTenders ?? 0}
              icon={<FileText className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-blue-50" iconColor="text-[var(--brand-primary)]"
              href="/admin/tenders"
            />
            <StatCard
              label="Đang nhận báo giá"
              value={s?.openTenders ?? 0}
              icon={<CheckCircle className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
              href="/admin/tenders"
              note={s?.openTenders ? "Đang mở" : "Không có gói nào"}
              noteColor={s?.openTenders ? "text-emerald-500" : "text-slate-400"}
            />
            <StatCard
              label="NCC chờ duyệt"
              value={s?.pendingSuppliers ?? 0}
              icon={<Users className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-amber-50" iconColor="text-amber-600"
              href="/admin/suppliers"
              note={s?.pendingSuppliers ? "Cần xử lý" : "Không có"}
              noteColor={s?.pendingSuppliers ? "text-amber-500" : "text-slate-400"}
            />
            <StatCard
              label="Báo giá mới"
              value={s?.newBids ?? 0}
              icon={<DollarSign className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-purple-50" iconColor="text-purple-600"
              href="/admin/bids"
              note={s?.totalBids ? `Tổng: ${s.totalBids} báo giá` : undefined}
            />
            <StatCard
              label="Đã có kết quả"
              value={s?.awardedTenders ?? 0}
              icon={<Award className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
              href="/admin/tenders"
              note={s?.awardedBids ? `${s.awardedBids} NCC được chọn` : undefined}
              noteColor="text-emerald-500"
            />
            <StatCard
              label="Giá trị đã chốt"
              value={formatCurrency(s?.totalAwardedValue ?? 0)}
              icon={<TrendingUp className="w-5 h-5" strokeWidth={1.8} />}
              iconBg="bg-[var(--brand-accent-light)]" iconColor="text-[var(--brand-accent)]"
              note={s?.totalTenderValue ? `Dự kiến: ${formatCurrency(s.totalTenderValue)}` : undefined}
            />
          </>
        )}
      </div>

      {/* ── Trend chart + Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Trend chart */}
        <section className="card p-5 lg:col-span-3">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-4">
            Hoạt động 6 tháng gần nhất
          </h3>
          {loading ? (
            <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
          ) : trends.length > 0 ? (
            <TrendChart data={trends} />
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Chưa có dữ liệu.</p>
          )}
        </section>

        {/* Quick actions */}
        <section className="card p-5 lg:col-span-2">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-3">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all text-center ${action.style}`}
                >
                  <Icon className={`w-5 h-5 ${action.iconColor}`} strokeWidth={1.8} />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Activity + Tasks ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent activity */}
        <section className="card overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-[var(--border-muted)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <h3 className="text-[13.5px] font-semibold text-slate-800">Hoạt động gần đây</h3>
            </div>
            {allActivities.length > 6 ? (
              <button
                type="button"
                onClick={() => setShowActivityHistory(true)}
                className="text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-accent)] flex items-center gap-1"
              >
                Xem thêm <ArrowRight className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          {activities.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-slate-400">
              {loading ? "Đang tải..." : "Chưa có hoạt động nào."}
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))
            ) : tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs shrink-0 ${urgencyBadgeClass(task.urgency)}`}>
                      {task.count}
                    </span>
                    <span className="text-[13px] text-slate-700 group-hover:text-slate-900 truncate">
                      {task.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 ml-2" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ── Activity history modal ──────────────────────────────────────────── */}
      {showActivityHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl max-h-[82vh] bg-white rounded-2xl border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-muted)] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800">Lịch sử hoạt động</h3>
                <p className="text-xs text-slate-400 mt-0.5">{allActivities.length} hoạt động gần nhất.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityHistory(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                    <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50">
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
