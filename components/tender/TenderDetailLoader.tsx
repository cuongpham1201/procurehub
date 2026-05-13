"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TenderDetailPage from "./TenderDetailPage";
import type { Tender } from "@/types/tender";
import { ensureTenderSeedData, getAdminTenderById, adminToPublicTender } from "@/services/tenderStorage";
import { getInternalSession } from "@/services/authStorage";
import { getCurrentSession } from "@/services/supplierAccountStorage";
import { getBidsBySupplier } from "@/services/supplierBidStorage";

type BlockedAs = "guest" | "supplier" | null;

export default function TenderDetailLoader({ id }: { id: string }) {
  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [blocked, setBlocked] = useState<BlockedAs>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureTenderSeedData();
    const adminTender = getAdminTenderById(id);

    if (!adminTender || adminTender.status === "Nháp") {
      setTender(undefined);
      setReady(true);
      return;
    }

    const isOpen =
      adminTender.status === "Đang mở" || adminTender.status === "Sắp đóng";

    const internalUser = getInternalSession();
    if (internalUser) {
      setTender(adminToPublicTender(adminTender));
      setReady(true);
      return;
    }

    const supplierUser = getCurrentSession();
    if (supplierUser) {
      if (isOpen) {
        setTender(adminToPublicTender(adminTender));
      } else {
        const hasBid = getBidsBySupplier(supplierUser.id).some(
          (b) => b.tenderId === adminTender.id
        );
        if (hasBid) {
          setTender(adminToPublicTender(adminTender));
        } else {
          setBlocked("supplier");
        }
      }
      setReady(true);
      return;
    }

    // guest
    if (isOpen) {
      setTender(adminToPublicTender(adminTender));
    } else {
      setBlocked("guest");
    }
    setReady(true);
  }, [id]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    );
  }

  if (blocked) {
    const message =
      blocked === "guest"
        ? "Gói thầu này hiện không còn công khai."
        : "Bạn không có quyền xem gói thầu này hoặc gói thầu đã ngừng nhận báo giá.";
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Không thể truy cập</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/tenders"
            className="px-5 py-2 text-sm font-medium text-[#0f2d5e] border border-[#0f2d5e]/30 rounded-lg hover:bg-[#0f2d5e] hover:text-white transition-colors"
          >
            Xem danh sách gói thầu
          </Link>
          {blocked === "guest" && (
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#1a3f7a] transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <TenderDetailPage tender={tender} />;
}
