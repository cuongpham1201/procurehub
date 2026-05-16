"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Building2,
  DollarSign,
  Users,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_GROUPS = [
  {
    label: "Menu",
    items: [
      { label: "Tổng quan",    href: "/admin",                 icon: LayoutDashboard },
      { label: "Gói thầu",     href: "/admin/tenders",         icon: FileText },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { label: "Nhà cung cấp", href: "/admin/suppliers", icon: Building2 },
      { label: "Báo giá",      href: "/admin/bids",      icon: DollarSign },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { label: "Người dùng",    href: "/admin/users",           icon: Users },
      { label: "Nhóm mua sắm", href: "/admin/categories",      icon: Package },
      { label: "Activity Log",  href: "/admin/activity-logs",   icon: Clock },
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "var(--sidebar-bg)" }}
      className={[
        "fixed inset-y-0 left-0 z-30 flex flex-col",
        "transition-[width,transform] duration-200 ease-in-out",
        "border-r border-white/5",
        /* mobile: slide in/out */
        open ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        /* desktop: width toggle */
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* ── Branding ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 border-b h-14 shrink-0"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {collapsed ? (
          <div className="mx-auto w-8 h-8 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center">
            <span className="text-[var(--brand-primary)] text-xs font-black leading-none">BHL</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="relative w-[120px] h-[36px] shrink-0">
              <Image
                src="/images/logo_ngang_biahalong.png"
                alt="Bia Hạ Long"
                fill
                className="object-contain object-left"
                style={{ filter: "brightness(0) invert(1)" }}
                priority
              />
            </div>
            <div
              className="text-[10.5px] font-medium leading-tight truncate"
              style={{ color: "var(--sidebar-text-secondary)" }}
            >
              Procurement Admin
            </div>
          </div>
        )}

        {/* Close button – mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Đóng menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label – visible only when expanded */}
            {!collapsed && (
              <div
                className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--sidebar-section-text)" }}
              >
                {group.label}
              </div>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      className={[
                        "sidebar-item",
                        collapsed ? "justify-center px-0 py-2" : "",
                        active ? "sidebar-item--active" : "",
                      ].join(" ")}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Divider */}
        <div
          className="border-t mx-1"
          style={{ borderColor: "var(--sidebar-border)" }}
        />

        {/* Back to public */}
        <Link
          href="/"
          title={collapsed ? "Về trang public" : undefined}
          className={[
            "sidebar-item text-white/50 hover:text-white/80",
            collapsed ? "justify-center px-0 py-2" : "",
          ].join(" ")}
        >
          <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          {!collapsed && <span className="truncate">Về trang chủ</span>}
        </Link>
      </nav>

      {/* ── Footer: collapse toggle ───────────────────────────────────────── */}
      <div
        className="px-2 py-3 border-t shrink-0"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className={[
            "sidebar-item w-full text-white/50 hover:text-white/80",
            collapsed ? "justify-center px-0 py-2" : "justify-between",
          ].join(" ")}
        >
          {!collapsed && (
            <span className="text-[12px]">Thu gọn menu</span>
          )}
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          )}
        </button>

        {!collapsed && (
          <div
            className="mt-2 px-2 text-[10.5px]"
            style={{ color: "var(--sidebar-section-text)" }}
          >
            ProcureHub · MVP v0.1
          </div>
        )}
      </div>
    </aside>
  );
}
