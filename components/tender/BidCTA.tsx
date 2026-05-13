"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentSession, getAccounts } from "@/services/supplierAccountStorage";
import { getInternalSession } from "@/services/authStorage";
import { getBidsBySupplier } from "@/services/supplierBidStorage";
import type { SupplierBid } from "@/types/supplierBid";
import type { SupplierAccount } from "@/types/supplierAccount";

function normalizeSupplierStatus(a: SupplierAccount): string {
  if (!a.profileCompleted) return "Chưa hoàn thiện";
  if (!a.status || a.status.trim() === "") return "Chờ xét duyệt";
  return a.status;
}

const CLOSED_STATUSES = ["Đã đóng", "Đang đánh giá", "Đã có kết quả", "Đã hủy"];

type UserType = "loading" | "guest" | "supplier" | "internal";

const BID_STATUS_CLS: Record<string, string> = {
  "Đã nộp":           "bg-blue-50 border-blue-200 text-blue-700",
  "Chờ xem xét":      "bg-amber-50 border-amber-200 text-amber-700",
  "Đang đánh giá":    "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Cần bổ sung":      "bg-orange-50 border-orange-200 text-orange-700",
  "Được chọn":        "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Không được chọn":  "bg-slate-50 border-slate-200 text-slate-500",
};

function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  return n.toLocaleString("vi-VN") + " ₫";
}

export default function BidCTA({
  tenderId,
  tenderCode,
  tenderStatus,
}: {
  tenderId: string;
  tenderCode: string;
  tenderStatus?: string;
}) {
  const [userType, setUserType] = useState<UserType>("loading");
  const [existingBid, setExistingBid] = useState<SupplierBid | null>(null);
  const [supplierStatus, setSupplierStatus] = useState<string>("");
  const [adminHref, setAdminHref] = useState("/admin/tenders");

  useEffect(() => {
    const internal = getInternalSession();
    if (internal) {
      setUserType("internal");
      setAdminHref(`/admin/tenders/${tenderId}`);
      return;
    }
    const session = getCurrentSession();
    if (session) {
      setUserType("supplier");
      const accounts = getAccounts();
      const fresh = accounts.find((a) => a.id === session.id) ?? session;
      setSupplierStatus(normalizeSupplierStatus(fresh));
      const bids = getBidsBySupplier(session.id);
      const found = bids.find(
        (b) => b.tenderId === tenderId || b.tenderCode === tenderCode
      );
      setExistingBid(found ?? null);
      return;
    }
    setUserType("guest");
  }, [tenderId, tenderCode]);

  const isClosed = tenderStatus && CLOSED_STATUSES.includes(tenderStatus);

  if (userType === "loading") {
    return (
      <div className="w-full block text-center bg-slate-50 border border-slate-100 text-slate-300 font-semibold text-sm py-3 rounded-xl select-none">
        ...
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="w-full block text-center bg-slate-100 text-slate-400 font-semibold text-sm py-3 rounded-xl cursor-not-allowed select-none">
        Gói thầu đã đóng
      </div>
    );
  }

  if (userType === "internal") {
    return (
      <Link
        href={adminHref}
        className="w-full flex items-center justify-center gap-2 bg-[#0f2d5e] hover:bg-[#0a1e3d] text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
        </svg>
        Quản lý gói thầu
      </Link>
    );
  }

  if (userType === "supplier" && existingBid) {
    const statusCls = BID_STATUS_CLS[existingBid.status] ?? BID_STATUS_CLS["Đã nộp"];
    const total = existingBid.totalAmount ?? existingBid.totalPrice ?? 0;
    const date = existingBid.submittedAt ?? existingBid.createdAt ?? "";
    const code = existingBid.bidCode ?? existingBid.id;
    return (
      <div className={`rounded-xl border p-4 ${statusCls}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide">Báo giá đã nộp</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-current bg-white/60">
            {existingBid.status}
          </span>
        </div>
        <div className="text-xs space-y-1 mb-3">
          <div>Mã BG: <span className="font-mono font-semibold">{code}</span></div>
          {date && <div>Ngày nộp: {new Date(date).toLocaleDateString("vi-VN")}</div>}
          <div>Tổng giá: <span className="font-semibold">{fmt(total)}</span></div>
        </div>
        <Link
          href="/supplier/bids"
          className="w-full flex items-center justify-center text-xs font-semibold py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition-colors border border-current"
        >
          Xem chi tiết báo giá →
        </Link>
      </div>
    );
  }

  if (userType === "supplier" && supplierStatus !== "Đã duyệt") {
    const isNeedsUpdate = supplierStatus === "Yêu cầu bổ sung";
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-800 mb-1">
          {isNeedsUpdate ? "Hồ sơ cần cập nhật" : "Tài khoản chưa được duyệt"}
        </p>
        <p className="text-xs text-amber-700 mb-3">
          {isNeedsUpdate
            ? "Vui lòng cập nhật hồ sơ theo yêu cầu bổ sung trước khi nộp báo giá."
            : "Tài khoản chưa được phê duyệt. Hệ thống sẽ thông báo khi hồ sơ được xét duyệt."}
        </p>
        <Link
          href="/supplier/profile"
          className="w-full flex items-center justify-center text-xs font-semibold py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-200"
        >
          {isNeedsUpdate ? "Cập nhật hồ sơ →" : "Xem hồ sơ →"}
        </Link>
      </div>
    );
  }

  if (userType === "supplier") {
    return (
      <Link
        href={`/supplier/submit-bid?tenderId=${tenderId}`}
        className="w-full block text-center bg-[#c9a227] text-[#0f2d5e] font-semibold text-sm py-3 rounded-xl hover:bg-[#b8960c] transition-colors shadow-sm"
      >
        Nộp báo giá
      </Link>
    );
  }

  // guest
  return (
    <Link
      href="/login"
      className="w-full block text-center bg-[#0f2d5e] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#0a1e3d] transition-colors shadow-sm"
    >
      Đăng nhập để nộp báo giá
    </Link>
  );
}
