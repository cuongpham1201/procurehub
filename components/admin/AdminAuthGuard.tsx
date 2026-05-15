"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const ALLOWED_ROLES = new Set([
  "Admin",
  "Kế hoạch vật tư",
  "Trưởng phòng vật tư",
  "Ban giám đốc",
  "Chỉ xem",
]);

type Status = "loading" | "authorized" | "unauthorized";

function UnauthorizedScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Khu vực quản trị</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Bạn cần đăng nhập tài khoản nội bộ Bia Hạ Long để truy cập khu vực quản trị.
          Liên hệ quản trị hệ thống nếu chưa có tài khoản.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/login?type=internal"
            className="w-full py-2.5 px-4 bg-[#0f2d5e] text-white text-sm font-semibold rounded-lg hover:bg-[#0d2550] transition-colors">
            Đăng nhập nội bộ
          </Link>
          <Link href="/"
            className="w-full py-2.5 px-4 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">Bia Hạ Long Procurement · Cổng quản trị nội bộ</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Đang kiểm tra quyền truy cập...
      </div>
    </div>
  );
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (loading) return;
    if (!user || user.kind !== "internal" || !ALLOWED_ROLES.has(user.role)) {
      setStatus("unauthorized");
    } else {
      setStatus("authorized");
    }
  }, [user, loading]);

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthorized") return <UnauthorizedScreen />;
  return <>{children}</>;
}
