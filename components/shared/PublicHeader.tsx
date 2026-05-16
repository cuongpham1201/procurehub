"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser, logout } from "@/hooks/useCurrentUser";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Gói thầu", href: "/tenders" },
  { label: "Hướng dẫn", href: "/guide" },
  { label: "Liên hệ", href: "#" },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === href;
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refetch } = useCurrentUser();

  async function handleLogout() {
    await logout();
    refetch();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/">
              <Image
                src="/images/logo-bia-ha-long.png"
                alt="Bia Hạ Long"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <Link
              href="/"
              className="hidden sm:block text-sm font-medium text-slate-500 leading-tight hover:text-[#0f2d5e] transition-colors"
            >
              Cổng đấu thầu
              <br />
              <span className="text-xs text-slate-400">Mua sắm nhà cung cấp</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href, pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "text-[#0f2d5e] bg-slate-100 font-semibold"
                      : "text-slate-600 hover:text-[#0f2d5e] hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {user?.kind === "internal" ? (
              <>
                <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600">
                  <span className="inline-block w-2 h-2 bg-[#c9a227] rounded-full" />
                  <span className="max-w-[140px] truncate">{user.name}</span>
                </span>
                <NotificationBell variant="admin" />
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#0f2d5e] bg-[#c9a227] rounded-md hover:bg-[#b8960c] transition-colors"
                >
                  Quản trị
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : user?.kind === "supplier" ? (
              <>
                <span className="hidden sm:block text-sm text-slate-600 max-w-[140px] truncate">
                  {user.name}
                </span>
                <NotificationBell variant="admin" />
                <Link
                  href="/supplier/dashboard"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#0f2d5e] bg-[#c9a227] rounded-md hover:bg-[#b8960c] transition-colors"
                >
                  Portal NCC
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/supplier/register-account"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#0f2d5e] bg-[#c9a227] rounded-md hover:bg-[#b8960c] transition-colors"
                >
                  Đăng ký nhà cung cấp
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
