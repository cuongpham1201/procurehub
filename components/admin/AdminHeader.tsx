"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, logout } from "@/hooks/useCurrentUser";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Menu, ChevronRight, LogOut, User, Home, KeyRound } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
}

/* ── Page title + breadcrumb config ─────────────────────────────────────── */

interface BreadcrumbItem { label: string; href?: string; }

const ROUTE_META: Record<string, { label: string; parent?: string }> = {
  "/admin":                   { label: "Tổng quan" },
  "/admin/tenders":           { label: "Gói thầu",              parent: "/admin" },
  "/admin/tenders/create":    { label: "Tạo gói thầu",          parent: "/admin/tenders" },
  "/admin/suppliers":         { label: "Nhà cung cấp",          parent: "/admin" },
  "/admin/bids":              { label: "Báo giá",               parent: "/admin" },
  "/admin/bid-comparison":    { label: "So sánh báo giá",       parent: "/admin" },
  "/admin/users":             { label: "Người dùng",            parent: "/admin" },
  "/admin/categories":        { label: "Nhóm mua sắm",          parent: "/admin" },
  "/admin/activity-logs":     { label: "Activity Log",          parent: "/admin" },
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Exact match first
  if (ROUTE_META[pathname]) {
    const meta = ROUTE_META[pathname];
    const crumbs: BreadcrumbItem[] = [];
    if (meta.parent && ROUTE_META[meta.parent]) {
      crumbs.push({ label: ROUTE_META[meta.parent].label, href: meta.parent });
    }
    crumbs.push({ label: meta.label });
    return crumbs;
  }
  // Dynamic segment (e.g. /admin/tenders/abc-123)
  for (const key of Object.keys(ROUTE_META)) {
    if (pathname.startsWith(key + "/") && key !== "/admin") {
      const meta = ROUTE_META[key];
      const crumbs: BreadcrumbItem[] = [];
      if (meta.parent && ROUTE_META[meta.parent]) {
        crumbs.push({ label: ROUTE_META[meta.parent].label, href: meta.parent });
      }
      crumbs.push({ label: meta.label, href: key });
      crumbs.push({ label: "Chi tiết" });
      return crumbs;
    }
  }
  return [{ label: "Admin" }];
}

function getPageTitle(pathname: string): string {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname].label;
  for (const key of Object.keys(ROUTE_META)) {
    if (pathname.startsWith(key + "/") && key !== "/admin") return ROUTE_META[key].label;
  }
  return "Admin";
}

/* ── User avatar initials ───────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  const { user, loading } = useCurrentUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const displayName = user?.name ?? "Admin";
  const displayRole = user?.role ?? (loading ? "..." : "Demo");
  const isDemo = !loading && !user;
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[var(--border-default)] h-14 flex items-center px-4 gap-3 shrink-0">

      {/* Hamburger – mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 -ml-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="Mở menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
        {breadcrumbs.length > 1 ? (
          <>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" strokeWidth={2} />
                  )}
                  {!isLast && crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-slate-400 hover:text-slate-700 transition-colors font-medium truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-slate-800 font-semibold truncate" : "text-slate-400 truncate"}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </>
        ) : (
          <span className="text-slate-800 font-semibold">{pageTitle}</span>
        )}

        {isDemo && (
          <span className="ml-2 hidden sm:inline text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-medium shrink-0">
            Demo
          </span>
        )}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Home link */}
        <Link
          href="/"
          title="Về trang chủ"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>

        <NotificationBell variant="admin" />

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ background: "var(--brand-primary)" }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-[12.5px] font-semibold text-slate-800 leading-none mb-0.5">{displayName}</div>
              <div
                className={`text-[10.5px] font-medium leading-none ${isDemo ? "text-amber-500" : "text-[var(--brand-accent)]"}`}
              >
                {displayRole}
              </div>
            </div>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-[var(--border-default)] shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border-muted)]">
                <div className="text-[13px] font-semibold text-slate-800">{displayName}</div>
                <div className={`text-xs ${isDemo ? "text-amber-500" : "text-[var(--brand-accent)]"} font-medium mt-0.5`}>
                  {displayRole}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  Về trang chủ
                </Link>
                <Link
                  href="/admin/change-password"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Đổi mật khẩu
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
