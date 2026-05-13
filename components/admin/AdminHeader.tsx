"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getInternalSession, clearAllSessions } from "@/services/authStorage";
import type { InternalUser } from "@/types/internalUser";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/tenders": "Gói thầu",
  "/admin/suppliers": "Nhà cung cấp",
  "/admin/bids": "Báo giá",
  "/admin/bid-comparison": "So sánh báo giá",
  "/admin/users": "Quản lý người dùng",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const key of Object.keys(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return PAGE_TITLES[key];
  }
  return "Admin";
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const [user, setUser] = useState<InternalUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getInternalSession());
    setChecked(true);
  }, []);

  function handleLogout() {
    clearAllSessions();
    router.push("/");
  }

  const displayName = user?.fullName ?? (user as { name?: string } | null)?.name ?? "Admin hệ thống";
  const displayRole = user?.role ?? (checked ? "Demo" : "...");
  const isDemo = checked && !user;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-4">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Mở menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <h1 className="text-base font-semibold text-slate-800 truncate">{pageTitle}</h1>
        {isDemo && (
          <span className="hidden sm:inline text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
            Chế độ demo
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Back to public */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Trang chủ
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-[#0f2d5e] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-semibold text-slate-800">{displayName}</div>
            <div className={`text-[10px] font-medium ${isDemo ? "text-amber-500" : "text-[#c9a227]"}`}>
              {displayRole}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
