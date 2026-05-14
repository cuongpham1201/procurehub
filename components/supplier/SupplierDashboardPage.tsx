"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentSession,
  clearSession,
  getAccounts,
} from "@/services/supplierAccountStorage";
import { getBidsBySupplier } from "@/services/supplierBidStorage";
import { getTenders, ensureTenderSeedData } from "@/services/tenderStorage";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { SupplierBid } from "@/types/supplierBid";
import {
  FileText,
  ClipboardList,
  DollarSign,
  Bell,
  LogOut,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";

// ── icons ──────────────────────────────────────────────────────────────────
function IconFile() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconTenders() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconBid() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// ── not-logged-in state ────────────────────────────────────────────────────
function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f2d5e] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Bia Hạ Long <span className="text-[#c9a227]">Procurement</span>
          </Link>
          <span className="text-sm text-white/60">Portal nhà cung cấp</span>
        </div>
      </header>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-400">
            <IconFile />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Bạn chưa đăng nhập
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Đăng nhập vào tài khoản nhà cung cấp để truy cập Portal và quản lý hồ sơ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/supplier/register-account"
              className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Đăng ký nhà cung cấp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:border-[#0f2d5e]/30 hover:shadow-md transition-all">
        {inner}
      </Link>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      {inner}
    </div>
  );
}

// ── activity builder ──────────────────────────────────────────────────────

interface SupplierActivity {
  id: string;
  type: "profile" | "bid" | "tender";
  priority: "high" | "medium" | "low";
  colorScheme: "amber" | "emerald" | "orange" | "blue" | "slate" | "indigo" | "green" | "red";
  title: string;
  description: string;
  date?: string;
  actionLabel?: string;
  actionHref?: string;
}

function buildSupplierActivities(
  account: SupplierAccount,
  myBids: SupplierBid[],
  unbidOpenTenders: number,
): SupplierActivity[] {
  const activities: SupplierActivity[] = [];

  const status = !account.profileCompleted
    ? "Chưa hoàn thiện"
    : !account.status || account.status.trim() === ""
    ? "Chờ xét duyệt"
    : account.status;

  // Profile activity
  if (status === "Chưa hoàn thiện") {
    activities.push({ id: "profile-incomplete", type: "profile", priority: "high", colorScheme: "amber",
      title: "Hồ sơ nhà cung cấp chưa hoàn thiện",
      description: "Hoàn thiện hồ sơ để được xét duyệt và tham gia báo giá.",
      actionLabel: "Hoàn thiện hồ sơ", actionHref: "/supplier/profile" });
  } else if (status === "Yêu cầu bổ sung") {
    activities.push({ id: "profile-supplement", type: "profile", priority: "high", colorScheme: "amber",
      title: "Cần bổ sung hồ sơ",
      description: "Phòng mua sắm yêu cầu bổ sung thông tin trước khi phê duyệt.",
      actionLabel: "Cập nhật hồ sơ", actionHref: "/supplier/profile" });
  } else if (status === "Từ chối") {
    activities.push({ id: "profile-rejected", type: "profile", priority: "high", colorScheme: "red",
      title: "Hồ sơ chưa được chấp thuận",
      description: "Liên hệ phòng kế hoạch vật tư để biết thêm chi tiết.",
      actionLabel: "Xem hồ sơ", actionHref: "/supplier/profile" });
  } else if (status === "Tạm khóa") {
    activities.push({ id: "profile-locked", type: "profile", priority: "high", colorScheme: "orange",
      title: "Tài khoản đang bị tạm khóa",
      description: "Liên hệ phòng kế hoạch vật tư để biết lý do và hướng xử lý.",
      actionLabel: "Xem hồ sơ", actionHref: "/supplier/profile" });
  } else if (status === "Chờ xét duyệt") {
    activities.push({ id: "profile-pending", type: "profile", priority: "medium", colorScheme: "blue",
      title: "Hồ sơ đang chờ xét duyệt",
      description: "Bia Hạ Long đang xem xét hồ sơ nhà cung cấp của bạn. Thời gian xét duyệt thường 1–3 ngày làm việc.",
      actionLabel: "Xem hồ sơ", actionHref: "/supplier/profile" });
  } else if (status === "Đã duyệt") {
    activities.push({ id: "profile-approved", type: "profile", priority: "low", colorScheme: "green",
      title: "Hồ sơ đã được duyệt",
      description: "Bạn có thể tham gia báo giá các gói thầu đang mở.",
      actionLabel: "Xem gói thầu", actionHref: "/tenders" });
  }

  // Bid activities
  for (const bid of myBids) {
    const tLabel = [bid.tenderCode, bid.tenderTitle ?? bid.tenderName ?? ""].filter(Boolean).join(" – ");
    const date = bid.submittedAt ?? bid.createdAt;
    if (bid.status === "Được chọn") {
      activities.push({ id: `bid-chosen-${bid.id}`, type: "bid", priority: "high", colorScheme: "emerald",
        title: "Chúc mừng! Báo giá được chọn", description: tLabel, date,
        actionLabel: "Xem báo giá", actionHref: "/supplier/bids" });
    } else if (bid.status === "Cần bổ sung") {
      activities.push({ id: `bid-supplement-${bid.id}`, type: "bid", priority: "high", colorScheme: "orange",
        title: "Báo giá cần bổ sung thông tin",
        description: `${tLabel}. Vui lòng kiểm tra phản hồi từ phòng mua sắm.`, date,
        actionLabel: "Xem chi tiết", actionHref: "/supplier/bids" });
    } else if (bid.status === "Không được chọn") {
      activities.push({ id: `bid-rejected-${bid.id}`, type: "bid", priority: "medium", colorScheme: "slate",
        title: "Báo giá không được chọn",
        description: `${tLabel}. Cảm ơn bạn đã tham gia báo giá.`, date,
        actionLabel: "Xem kết quả", actionHref: "/supplier/bids" });
    } else if (bid.status === "Đang đánh giá") {
      activities.push({ id: `bid-eval-${bid.id}`, type: "bid", priority: "medium", colorScheme: "indigo",
        title: "Báo giá đang được đánh giá",
        description: `${tLabel}. Phòng mua sắm đang xem xét báo giá của bạn.`, date,
        actionLabel: "Theo dõi", actionHref: "/supplier/bids" });
    } else if (bid.status === "Đã nộp" || bid.status === "Chờ xem xét") {
      activities.push({ id: `bid-submitted-${bid.id}`, type: "bid", priority: "low", colorScheme: "slate",
        title: "Báo giá đã nộp – chờ xử lý", description: tLabel, date,
        actionLabel: "Xem báo giá", actionHref: "/supplier/bids" });
    }
  }

  // Available tenders (approved only)
  if (status === "Đã duyệt" && unbidOpenTenders > 0) {
    activities.push({ id: "tenders-available", type: "tender", priority: "medium", colorScheme: "green",
      title: `Có ${unbidOpenTenders} gói thầu đang chờ báo giá`,
      description: "Xem danh sách gói thầu đang mở và gửi báo giá phù hợp.",
      actionLabel: "Xem ngay", actionHref: "/tenders" });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  activities.sort((a, b) => {
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });
  return activities.slice(0, 6);
}

// ── activity color map ─────────────────────────────────────────────────────

const ACT_COLORS: Record<string, { bg: string; border: string; icon: string; title: string; desc: string; btn: string }> = {
  amber:   { bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-500",  title: "text-amber-900",  desc: "text-amber-700",  btn: "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200"  },
  emerald: { bg: "bg-slate-50",  border: "border-slate-200",  icon: "text-[#0f2d5e]",  title: "text-slate-800",  desc: "text-slate-600",  btn: "bg-[#0f2d5e] hover:bg-[#0a245a] text-white border-transparent"   },
  orange:  { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500", title: "text-orange-900", desc: "text-orange-700", btn: "bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-200" },
  blue:    { bg: "bg-blue-50",   border: "border-blue-200",   icon: "text-blue-500",   title: "text-blue-900",   desc: "text-blue-700",   btn: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200"    },
  slate:   { bg: "bg-slate-50",  border: "border-slate-200",  icon: "text-slate-400",  title: "text-slate-700",  desc: "text-slate-500",  btn: "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" },
  indigo:  { bg: "bg-slate-50",  border: "border-slate-200",  icon: "text-[#c9a227]",  title: "text-slate-800",  desc: "text-slate-600",  btn: "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200" },
  green:   { bg: "bg-slate-50",  border: "border-slate-200",  icon: "text-[#0f2d5e]",  title: "text-slate-800",  desc: "text-slate-600",  btn: "bg-[#c9a227]/10 hover:bg-[#c9a227]/20 text-[#7a6010] border-[#c9a227]/20" },
  red:     { bg: "bg-red-50",    border: "border-red-200",    icon: "text-red-400",    title: "text-red-900",    desc: "text-red-700",    btn: "bg-red-100 hover:bg-red-200 text-red-900 border-red-200"         },
};

function ActivityIcon({ item }: { item: SupplierActivity }) {
  if (item.type === "bid" && item.colorScheme === "emerald") {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (item.type === "bid") return <IconBid />;
  if (item.type === "tender") return <IconTenders />;
  if (item.colorScheme === "green" || item.colorScheme === "emerald") {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (item.colorScheme === "blue") return <IconClock />;
  return <IconAlert />;
}

function formatActDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return ""; }
}

// ── main component ─────────────────────────────────────────────────────────
export default function SupplierDashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<SupplierAccount | null>(null);
  const [myBids, setMyBids] = useState<SupplierBid[]>([]);
  const [openTenders, setOpenTenders] = useState(0);
  const [unbidOpenTenders, setUnbidOpenTenders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureTenderSeedData();
    async function loadData() {
      const allOpen = (await getTenders()).filter((t) => t.status === "Đang mở" || t.status === "Sắp đóng");
      setOpenTenders(allOpen.length);

      const session = getCurrentSession();
      if (!session) {
        setUnbidOpenTenders(allOpen.length);
        setLoading(false);
        return;
      }
      const accounts = await getAccounts();
      const fresh = accounts.find((a) => a.id === session.id);
      setAccount(fresh ?? session);
      const bids = await getBidsBySupplier(session.id);
      setMyBids(bids);
      const bidTenderIds = new Set(bids.map((b) => b.tenderId));
      setUnbidOpenTenders(allOpen.filter((t) => !bidTenderIds.has(t.id)).length);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    );
  }

  if (!account) return <NotLoggedIn />;

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  function normalizeStatus(a: SupplierAccount): string {
    if (!a.profileCompleted) return "Chưa hoàn thiện";
    if (!a.status || a.status.trim() === "") return "Chờ xét duyệt";
    return a.status;
  }
  const isApproved = normalizeStatus(account) === "Đã duyệt";

  function getStatusBadge(status: string) {
    switch (status) {
      case "Đã duyệt":         return { label: "Đã duyệt", cls: "bg-green-100 text-green-700" };
      case "Chờ xét duyệt":    return { label: "Chờ xét duyệt", cls: "bg-blue-100 text-blue-700" };
      case "Yêu cầu bổ sung":  return { label: "Yêu cầu bổ sung", cls: "bg-amber-100 text-amber-700" };
      case "Từ chối":           return { label: "Từ chối", cls: "bg-red-100 text-red-700" };
      case "Tạm khóa":          return { label: "Tạm khóa", cls: "bg-orange-100 text-orange-700" };
      default:                  return { label: "Chưa hoàn thiện", cls: "bg-slate-100 text-slate-500" };
    }
  }
  const profileBadge = getStatusBadge(account.status);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b border-white/10"
        style={{ background: "var(--brand-primary)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <div className="relative w-[110px] h-[32px]">
                <Image
                  src="/images/logo_ngang_biahalong.png"
                  alt="Bia Hạ Long"
                  fill
                  className="object-contain object-left"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
            </Link>
            <div className="hidden sm:block w-px h-5 bg-white/20 shrink-0" />
            <span className="hidden sm:block text-sm text-white/55">Portal nhà cung cấp</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-white/65">
              <Building2 className="w-3.5 h-3.5 text-white/40 shrink-0" strokeWidth={1.8} />
              <span className="truncate max-w-[200px]">{account.companyName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-white/65 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Portal welcome hero */}
        <div
          className="relative overflow-hidden rounded-2xl mb-8"
          style={{ background: "var(--brand-primary-dark)", minHeight: 128 }}
        >
          {/* Subtle factory background */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <Image
              src="/images/nha may.jpg"
              alt=""
              fill
              className="object-cover object-center"
              style={{ opacity: 0.08 }}
            />
          </div>
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(8,25,58,0.97) 40%, rgba(8,25,58,0.78) 100%)",
            }}
          />
          {/* Gold accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "var(--brand-accent)", opacity: 0.7 }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
            <div className="min-w-0">
              <div
                className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: "var(--brand-accent)", opacity: 0.85 }}
              >
                Nhà cung cấp
              </div>
              <h1 className="text-white text-[19px] font-bold leading-tight mb-2 truncate">
                {account.companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-white/45 text-[12px]">
                  Mã: <span className="font-mono text-white/75">{account.id}</span>
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profileBadge.cls}`}>
                  {profileBadge.label}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/supplier/profile"
                className="font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                style={{ background: "var(--brand-accent)", color: "var(--brand-primary)" }}
              >
                {account.profileCompleted ? "Xem hồ sơ" : "Hoàn thiện hồ sơ"}
              </Link>
              <Link
                href="/tenders"
                className="border border-white/25 text-white/80 hover:bg-white/10 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Gói thầu
              </Link>
            </div>
          </div>
        </div>

        {/* Status notice — dynamic based on real approval status */}
        {account.status === "Chưa hoàn thiện" || !account.profileCompleted ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
            <span className="text-amber-500 mt-0.5"><IconAlert /></span>
            <div>
              <p className="font-semibold mb-1">Hồ sơ chưa hoàn thiện</p>
              <p className="text-xs text-amber-700">
                Bổ sung thông tin năng lực doanh nghiệp để được xét duyệt và nhận yêu cầu báo giá từ Bia Hạ Long.
              </p>
              <Link
                href="/supplier/profile"
                className="inline-block mt-2 text-xs font-semibold text-amber-800 underline hover:no-underline"
              >
                Hoàn thiện ngay →
              </Link>
            </div>
          </div>
        ) : account.status === "Đã duyệt" ? (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 text-sm">
            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Bạn đã được duyệt tham gia hệ thống nhà cung cấp.</p>
              <p className="text-xs text-green-700">
                Tài khoản đã được phê duyệt. Bạn có thể tham gia báo giá các gói thầu đang mở.
              </p>
            </div>
          </div>
        ) : account.status === "Yêu cầu bổ sung" ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
            <span className="text-amber-500 mt-0.5"><IconAlert /></span>
            <div>
              <p className="font-semibold mb-1">Hồ sơ cần bổ sung thông tin theo yêu cầu của phòng mua sắm.</p>
              <p className="text-xs text-amber-700">
                Vui lòng cập nhật hồ sơ năng lực và liên hệ lại với phòng kế hoạch vật tư.
              </p>
              <Link
                href="/supplier/profile"
                className="inline-block mt-2 text-xs font-semibold text-amber-800 underline hover:no-underline"
              >
                Cập nhật hồ sơ →
              </Link>
            </div>
          </div>
        ) : account.status === "Từ chối" ? (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 text-sm">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Hồ sơ nhà cung cấp chưa được chấp thuận.</p>
              <p className="text-xs text-red-700">
                Hồ sơ không đáp ứng yêu cầu. Liên hệ phòng kế hoạch vật tư để biết thêm thông tin.
              </p>
            </div>
          </div>
        ) : account.status === "Tạm khóa" ? (
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 mb-6 text-sm">
            <span className="text-orange-500 mt-0.5"><IconAlert /></span>
            <div>
              <p className="font-semibold mb-1">Tài khoản đang bị tạm khóa.</p>
              <p className="text-xs text-orange-700">
                Liên hệ phòng kế hoạch vật tư để biết lý do và hướng xử lý.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6 text-sm">
            <span className="text-blue-500 mt-0.5"><IconClock /></span>
            <div>
              <p className="font-semibold mb-1">Hồ sơ đang chờ xét duyệt</p>
              <p className="text-xs text-blue-700">
                Bia Hạ Long đang xem xét hồ sơ của bạn. Thời gian xét duyệt thường từ 1–3 ngày làm việc.
              </p>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Trạng thái hồ sơ"
            value={normalizeStatus(account) === "Đã duyệt" ? "Đã duyệt" : normalizeStatus(account)}
            sub={account.profileCompleted ? "Hồ sơ đã nộp" : "Chưa hoàn thiện"}
            icon={<FileText className="w-5 h-5" strokeWidth={1.8} />}
            accent={
              normalizeStatus(account) === "Đã duyệt"
                ? "bg-[#0f2d5e]/10 text-[#0f2d5e]"
                : normalizeStatus(account) === "Từ chối" || normalizeStatus(account) === "Tạm khóa"
                ? "bg-red-50 text-red-500"
                : account.profileCompleted
                ? "bg-[#c9a227]/10 text-[#c9a227]"
                : "bg-amber-50 text-amber-500"
            }
          />
          <StatCard
            label="Gói thầu đang mở"
            value={openTenders}
            sub="Đang mở hoặc sắp đóng"
            icon={<ClipboardList className="w-5 h-5" strokeWidth={1.8} />}
            accent="bg-[#0f2d5e]/10 text-[#0f2d5e]"
          />
          <StatCard
            label="Báo giá đã nộp"
            value={myBids.length}
            sub={myBids.length > 0 ? `${myBids.filter(b => b.status === "Đã nộp").length} chờ xem xét` : "Chưa có báo giá nào"}
            icon={<DollarSign className="w-5 h-5" strokeWidth={1.8} />}
            accent={myBids.length > 0 ? "bg-[#c9a227]/10 text-[#c9a227]" : "bg-slate-100 text-slate-400"}
            href="/supplier/bids"
          />
          <StatCard
            label="Thông báo mới"
            value={1}
            sub="Chào mừng đến hệ thống"
            icon={<Bell className="w-5 h-5" strokeWidth={1.8} />}
            accent="bg-slate-100 text-slate-500"
          />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[var(--border-default)] p-5">
              <h2 className="text-[13px] font-semibold text-slate-700 mb-3">Thao tác nhanh</h2>
              <div className="space-y-1.5">
                {[
                  {
                    label: account.profileCompleted ? "Hồ sơ nhà cung cấp" : "Hoàn thiện hồ sơ",
                    sub: account.profileCompleted ? "Cập nhật thông tin" : "Bắt buộc để tham gia thầu",
                    href: "/supplier/profile",
                    icon: FileText,
                    primary: !account.profileCompleted,
                  },
                  {
                    label: "Gói thầu đang mở",
                    sub: `${openTenders} gói thầu chờ báo giá`,
                    href: "/tenders",
                    icon: ClipboardList,
                    primary: false,
                  },
                  ...(isApproved
                    ? [{
                        label: "Nộp báo giá",
                        sub: "Chọn gói thầu để nộp",
                        href: "/tenders",
                        icon: DollarSign,
                        primary: false,
                      }]
                    : [{
                        label: "Nộp báo giá",
                        sub: "Chờ xét duyệt hồ sơ trước",
                        href: "/supplier/profile",
                        icon: DollarSign,
                        primary: false,
                        disabled: true,
                      }]
                  ),
                  {
                    label: "Báo giá đã nộp",
                    sub: myBids.length > 0 ? `${myBids.length} báo giá` : "Chưa có báo giá",
                    href: "/supplier/bids",
                    icon: CheckCircle,
                    primary: false,
                  },
                ].map((action) => {
                  const isDisabled = "disabled" in action && action.disabled;
                  const Icon = action.icon;
                  const inner = (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          action.primary
                            ? "bg-[#c9a227]/10 text-[#c9a227]"
                            : isDisabled
                            ? "bg-slate-50 text-slate-300"
                            : "bg-[#0f2d5e]/6 text-[#0f2d5e]/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-medium leading-snug ${isDisabled ? "text-slate-400" : "text-slate-700"}`}>
                          {action.label}
                        </p>
                        <p className={`text-[11px] mt-0.5 leading-tight ${action.primary ? "text-amber-600" : "text-slate-400"}`}>
                          {action.sub}
                        </p>
                      </div>
                    </div>
                  );
                  if (isDisabled) {
                    return (
                      <div
                        key={action.label}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 opacity-50 cursor-not-allowed"
                      >
                        {inner}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 shrink-0" strokeWidth={2} />
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={[
                        "flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group",
                        action.primary
                          ? "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                          : "border border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {inner}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" strokeWidth={2} />
                    </Link>
                  );
                })}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-100 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <span className="text-[13px] font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          {/* Activity / notifications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[var(--border-default)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--border-muted)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                  <h2 className="text-[13.5px] font-semibold text-slate-800">Thông báo &amp; hoạt động</h2>
                </div>
                <span className="text-xs text-slate-400">Cập nhật tự động</span>
              </div>
              <div className="p-5">
              {(() => {
                const activities = buildSupplierActivities(account, myBids, unbidOpenTenders);
                if (activities.length === 0) {
                  return (
                    <p className="text-sm text-slate-400 text-center py-10 leading-relaxed">
                      Chưa có thông báo mới.<br />
                      Khi có cập nhật về hồ sơ hoặc báo giá, hệ thống sẽ hiển thị tại đây.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2.5">
                    {activities.map((item) => {
                      const c = ACT_COLORS[item.colorScheme] ?? ACT_COLORS.slate;
                      const dateStr = formatActDate(item.date);
                      return (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                          <span className={`mt-0.5 shrink-0 ${c.icon}`}>
                            <ActivityIcon item={item} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug ${c.title}`}>{item.title}</p>
                            {item.description && (
                              <p className={`text-xs mt-0.5 leading-relaxed ${c.desc}`}>{item.description}</p>
                            )}
                            {dateStr && (
                              <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
                            )}
                          </div>
                          {item.actionLabel && item.actionHref && (
                            <Link
                              href={item.actionHref}
                              className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors border whitespace-nowrap ${c.btn}`}
                            >
                              {item.actionLabel} →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              </div>
            </div>
          </div>
        </div>

        {/* Back home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
