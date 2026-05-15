"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { SupplierBid } from "@/types/supplierBid";
import type { SupplierAccount } from "@/types/supplierAccount";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOSED_STATUSES = ["Đã đóng", "Đang đánh giá", "Đã có kết quả", "Đã hủy"];

const BID_STATUS_CLS: Record<string, string> = {
  "Đã nộp":           "bg-blue-50 border-blue-200 text-blue-700",
  "Chờ xem xét":      "bg-amber-50 border-amber-200 text-amber-700",
  "Đang đánh giá":    "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Cần bổ sung":      "bg-orange-50 border-orange-200 text-orange-700",
  "Đã bổ sung":       "bg-teal-50 border-teal-200 text-teal-700",
  "Được chọn":        "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Không được chọn":  "bg-slate-50 border-slate-200 text-slate-500",
};

function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  return n.toLocaleString("vi-VN") + " ₫";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCTA() {
  return (
    <div className="w-full h-12 rounded-xl bg-slate-100 animate-pulse" />
  );
}

function ClosedCTA() {
  return (
    <div className="w-full text-center bg-slate-100 text-slate-400 font-semibold text-sm py-3 rounded-xl cursor-not-allowed select-none">
      Gói thầu đã đóng
    </div>
  );
}

/** Internal users: link to admin management */
function InternalCTA({ tenderId }: { tenderId: string }) {
  return (
    <Link
      href={`/admin/tenders/${tenderId}`}
      className="w-full flex items-center justify-center gap-2 bg-[#0f2d5e] hover:bg-[#0a1e3d] text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" strokeWidth={2} />
      </svg>
      Quản lý gói thầu
    </Link>
  );
}

/** Supplier has already submitted a bid */
function ExistingBidCTA({
  bid,
  tenderStatus,
  tenderId,
}: {
  bid: SupplierBid;
  tenderStatus?: string;
  tenderId: string;
}) {
  const statusCls = BID_STATUS_CLS[bid.status] ?? BID_STATUS_CLS["Đã nộp"];
  const total = bid.totalAmount ?? bid.totalPrice ?? 0;
  const date = bid.submittedAt ?? bid.createdAt ?? "";
  const code = bid.bidCode ?? bid.id;
  const canUpdate = bid.status === "Cần bổ sung";

  return (
    <div className={`rounded-xl border p-4 ${statusCls}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide">Đã nộp báo giá</span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-current bg-white/60">
          {bid.status}
        </span>
      </div>

      {/* Details */}
      <div className="text-xs space-y-1 mb-4">
        <div>
          Mã báo giá: <span className="font-mono font-semibold">{code}</span>
        </div>
        {date && (
          <div>
            Ngày nộp:{" "}
            <span className="font-medium">
              {new Date(date).toLocaleDateString("vi-VN")}
            </span>
          </div>
        )}
        <div>
          Tổng giá: <span className="font-semibold">{fmt(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Link
          href="/supplier/bids"
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/60 hover:bg-white/90 transition-colors border border-current"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Xem báo giá đã nộp
        </Link>
        {canUpdate && (
          <Link
            href={`/supplier/submit-bid?tenderId=${tenderId}&edit=${bid.id}`}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 transition-colors border border-orange-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Cập nhật báo giá
          </Link>
        )}
      </div>
    </div>
  );
}

/** Supplier not yet approved */
function NotApprovedCTA({ profile }: { profile: SupplierAccount }) {
  const needsUpdate =
    profile.status === "Yêu cầu bổ sung" ||
    !profile.profileCompleted;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {needsUpdate ? "Hồ sơ cần cập nhật" : "Tài khoản chưa được duyệt"}
          </p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            {needsUpdate
              ? "Vui lòng cập nhật hồ sơ theo yêu cầu bổ sung trước khi nộp báo giá."
              : "Tài khoản đang chờ xét duyệt. Hệ thống sẽ thông báo khi được phê duyệt."}
          </p>
        </div>
      </div>
      <Link
        href="/supplier/profile"
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-300"
      >
        {needsUpdate ? "Cập nhật hồ sơ →" : "Xem hồ sơ →"}
      </Link>
    </div>
  );
}

/** Supplier approved, no existing bid → primary submit CTA */
function SubmitBidCTA({ tenderId }: { tenderId: string }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Status context */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
        <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
        <span className="text-xs text-slate-500">Bạn chưa nộp báo giá cho gói thầu này</span>
      </div>

      {/* Primary CTA */}
      <Link
        href={`/supplier/submit-bid?tenderId=${tenderId}`}
        className="w-full flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Nộp báo giá
      </Link>
    </div>
  );
}

/** Guest (not logged in) */
function GuestCTA() {
  return (
    <Link
      href="/login?type=supplier"
      className="w-full flex items-center justify-center gap-2 bg-[#0f2d5e] hover:bg-[#0a1e3d] text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      Đăng nhập để nộp báo giá
    </Link>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BidCTA({
  tenderId,
  tenderCode,
  tenderStatus,
}: {
  tenderId: string;
  tenderCode: string;
  tenderStatus?: string;
}) {
  const { user, loading: authLoading } = useCurrentUser();
  const [existingBid, setExistingBid] = useState<SupplierBid | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<SupplierAccount | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!user || user.kind !== "supplier") return;

    setDataLoading(true);
    Promise.all([
      // Bid lookup — API enforces supplier can only see their own
      fetch(`/api/bids?tenderId=${encodeURIComponent(tenderId)}`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then(({ data }) => {
          const bids = (data ?? []) as SupplierBid[];
          setExistingBid(
            bids.find(
              (b) => b.tenderId === tenderId || b.tenderCode === tenderCode,
            ) ?? null,
          );
        })
        .catch(() => {}),

      // Supplier profile — to check approval status
      fetch(`/api/suppliers/${encodeURIComponent(user.id)}`)
        .then((r) => (r.ok ? r.json() : { data: null }))
        .then(({ data }) => setSupplierProfile(data ?? null))
        .catch(() => {}),
    ]).finally(() => setDataLoading(false));
  }, [user, tenderId, tenderCode]);

  const isClosed = tenderStatus && CLOSED_STATUSES.includes(tenderStatus);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authLoading || (user?.kind === "supplier" && dataLoading)) {
    return <SkeletonCTA />;
  }

  // ── Closed tender (shown to everyone) ───────────────────────────────────
  if (isClosed) {
    return <ClosedCTA />;
  }

  // ── Internal user → admin management link ───────────────────────────────
  if (user?.kind === "internal") {
    return <InternalCTA tenderId={tenderId} />;
  }

  // ── Supplier — already submitted ─────────────────────────────────────────
  if (user?.kind === "supplier" && existingBid) {
    return (
      <ExistingBidCTA bid={existingBid} tenderStatus={tenderStatus} tenderId={tenderId} />
    );
  }

  // ── Supplier — not approved yet ──────────────────────────────────────────
  if (user?.kind === "supplier" && supplierProfile && supplierProfile.status !== "Đã duyệt") {
    return <NotApprovedCTA profile={supplierProfile} />;
  }

  // ── Supplier — approved, no bid → primary submit CTA ─────────────────────
  if (user?.kind === "supplier") {
    return <SubmitBidCTA tenderId={tenderId} />;
  }

  // ── Guest ─────────────────────────────────────────────────────────────────
  return <GuestCTA />;
}
