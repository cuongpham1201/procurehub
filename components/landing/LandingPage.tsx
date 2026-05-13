"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  processSteps,
  benefits,
} from "@/data/tenders";
import { getTenders, ensureTenderSeedData, adminToPublicTender } from "@/services/tenderStorage";
import { ensureCategorySeedData, getPurchaseCategories } from "@/services/categoryStorage";
import { toDateInputValue } from "@/services/dateUtils";
import type { Tender } from "@/types/tender";
import type { AdminTender } from "@/types/adminTender";
import type { PurchaseCategory } from "@/types/category";
import PublicHeader from "@/components/shared/PublicHeader";

// ─── Icon components (SVG inline) ────────────────────────────────────────────

function IconSearch() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ─── Icon nhóm hàng theo tên ──────────────────────────────────────────────────

function getCategoryIcon(name: string) {
  switch (name) {
    case "Nguyên vật liệu":
      return <IconBox />;
    case "Máy móc":
      return <IconGear />;
    case "Thiết bị":
      return <IconMonitor />;
    case "Công cụ dụng cụ":
      return <IconWrench />;
    case "Dịch vụ phụ trợ":
      return <IconUsers />;
    default:
      return <IconBox />;
  }
}

// ─── Màu badge trạng thái ─────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
  "Đang mở": "bg-green-100 text-green-700",
  "Sắp đóng": "bg-orange-100 text-orange-700",
  "Đã đóng": "bg-slate-100 text-slate-500",
  "Đã có kết quả": "bg-indigo-100 text-indigo-700",
};

interface CategorySummary {
  code: string;
  name: string;
  count: number;
}

function parseDateTime(value: string): number {
  const dateValue = toDateInputValue(value);
  const parsed = dateValue
    ? new Date(`${dateValue}T00:00:00`).getTime()
    : new Date(value).getTime();
  return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function buildCategories(tenders: AdminTender[], categories: PurchaseCategory[]): CategorySummary[] {
  return categories.map((category) => ({
    code: category.code,
    name: category.name,
    count: tenders.filter((t) => t.category === category.name || t.category === category.code).length,
  }));
}

function buildLatestOpenTenders(tenders: AdminTender[]): Tender[] {
  return [...tenders]
    .filter((t) => t.status === "Đang mở" || t.status === "Sắp đóng")
    .sort((a, b) => {
      const deadlineDiff = parseDateTime(a.deadline) - parseDateTime(b.deadline);
      if (deadlineDiff !== 0) return deadlineDiff;
      return parseDateTime(b.createdAt) - parseDateTime(a.createdAt);
    })
    .slice(0, 6)
    .map(adminToPublicTender);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({
  searchQuery,
  setSearchQuery,
  onSearch,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <section
      className="bg-[#0a1e3d] py-20 px-4"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #0a1e3d 0%, #0f2d5e 60%, #0d2550 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Tag nhỏ */}
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-8">
          <span className="w-2 h-2 bg-[#c9a227] rounded-full flex-shrink-0"></span>
          Hệ thống đấu thầu nội bộ của Bia Hạ Long
        </div>

        {/* Tiêu đề chính */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
          Cổng đấu thầu &amp; mua sắm
          <br className="hidden sm:block" />
          <span className="text-[#c9a227]"> Bia Hạ Long</span>
        </h1>

        {/* Mô tả */}
        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Minh bạch hóa quy trình mua sắm nguyên vật liệu, máy móc, thiết bị,
          công cụ dụng cụ và dịch vụ — kết nối Bia Hạ Long với các nhà cung
          cấp uy tín.
        </p>

        {/* Thanh tìm kiếm */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10"
        >
          <div className="flex-1 flex items-center bg-white rounded-lg px-4 gap-3 shadow-sm">
            <span className="text-slate-400 flex-shrink-0">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Tìm gói thầu theo tên, mã, nhóm hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold px-6 py-3.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Tìm kiếm
          </button>
        </form>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tenders"
            className="inline-flex items-center justify-center gap-2 bg-[#c9a227] text-[#0f2d5e] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8960c] transition-colors shadow-sm"
          >
            Xem gói thầu đang mở
            <IconChevronRight />
          </Link>
          <Link
            href="/supplier/register-account"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            Đăng ký nhà cung cấp
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Gói thầu mới nhất ────────────────────────────────────────────────────────

function LatestTenders({ latestSix }: { latestSix: Tender[] }) {
  return (
    <section className="bg-slate-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0f2d5e] mb-1">
              Gói thầu mới nhất
            </h2>
            <p className="text-slate-500 text-sm">
              Các gói thầu đang mở để nhà cung cấp nộp báo giá
            </p>
          </div>
          <Link
            href="/tenders"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
          >
            Xem tất cả <IconChevronRight />
          </Link>
        </div>

        {latestSix.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
            Chưa có gói thầu đang mở.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestSix.map((tender) => (
            <div
              key={tender.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
            >
              {/* Header card */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400">
                  {tender.code}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[tender.status] ?? "bg-slate-100 text-slate-500"}`}
                >
                  {tender.status}
                </span>
              </div>

              {/* Tên gói thầu */}
              <h3 className="text-sm font-semibold text-slate-800 mb-4 leading-5 flex-1">
                {tender.name}
              </h3>

              {/* Chi tiết */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nhóm hàng</span>
                  <span className="text-slate-700 font-medium">
                    {tender.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Hạn nộp hồ sơ</span>
                  <span className="text-slate-700 font-medium">
                    {tender.deadline}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Giá trị dự kiến</span>
                  <span className="text-[#0f2d5e] font-semibold">
                    {tender.value}
                  </span>
                </div>
              </div>

              {/* Nút xem chi tiết */}
              <Link
                href={`/tenders/${tender.id}`}
                className="block w-full text-center text-sm font-medium text-[#0f2d5e] border border-[#0f2d5e]/30 py-2 rounded-lg hover:bg-[#0f2d5e] hover:text-white hover:border-[#0f2d5e] transition-colors"
              >
                Xem chi tiết
              </Link>
            </div>
            ))}
          </div>
        )}

        {/* Xem tất cả trên mobile */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
          >
            Xem tất cả gói thầu <IconArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Nhóm mua sắm ────────────────────────────────────────────────────────────

function Categories({ categories }: { categories: CategorySummary[] }) {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#0f2d5e] mb-2">
            Nhóm mua sắm
          </h2>
          <p className="text-slate-500 text-sm">
            Tìm gói thầu theo danh mục hàng hóa và dịch vụ
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/tenders?q=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-slate-200 hover:border-[#c9a227]/50 hover:bg-amber-50/30 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[#0f2d5e] group-hover:bg-[#c9a227] group-hover:text-white transition-colors">
                {getCategoryIcon(cat.name)}
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-700 mb-0.5">
                  {cat.name}
                </div>
                <div className="text-xs text-slate-400">
                  {cat.count} gói thầu
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Quy trình tham gia ───────────────────────────────────────────────────────

function Process() {
  return (
    <section className="bg-slate-50 py-16 px-4 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[#0f2d5e] mb-2">
            Quy trình tham gia
          </h2>
          <p className="text-slate-500 text-sm">
            4 bước đơn giản để bắt đầu tham gia đấu thầu tại Bia Hạ Long
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {processSteps.map((step, idx) => (
            <div
              key={step.title}
              className="bg-white rounded-xl border border-slate-200 p-6 relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#c9a227] rounded-full flex items-center justify-center text-[#0f2d5e] text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                {idx < processSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400">
                    <IconChevronRight />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Lợi ích cho nhà cung cấp ────────────────────────────────────────────────

function Benefits() {
  return (
    <section
      className="bg-[#0a1e3d] py-16 px-4"
      style={{
        backgroundImage: "linear-gradient(135deg, #0a1e3d 0%, #0f2d5e 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">
            Lợi ích cho nhà cung cấp
          </h2>
          <p className="text-white/60 text-sm">
            Tại sao nhà cung cấp nên tham gia hệ thống đấu thầu Bia Hạ Long
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 bg-[#c9a227]/20 rounded-lg flex items-center justify-center text-[#c9a227] mb-4">
                <IconCheck />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-xs text-white/55 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA cuối trang ───────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="bg-[#0f2d5e] py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
          Sẵn sàng tham gia mạng lưới nhà cung cấp?
        </h2>
        <p className="text-white/70 mb-8 text-base leading-relaxed">
          Hàng trăm nhà cung cấp đã tham gia hệ thống để tiếp cận nhu cầu mua
          sắm minh bạch và ổn định của Bia Hạ Long.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/supplier/register-account"
            className="inline-flex items-center justify-center gap-2 bg-[#c9a227] text-[#0f2d5e] font-semibold px-6 py-3 rounded-lg hover:bg-[#b8960c] transition-colors shadow-sm"
          >
            Đăng ký nhà cung cấp
          </Link>
          <Link
            href="/tenders"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            Xem gói thầu <IconChevronRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const quickLinks = [
    { label: "Gói thầu đang mở", href: "/tenders" },
    { label: "Đăng ký nhà cung cấp", href: "/supplier/register-account" },
    { label: "Đăng nhập nhà cung cấp", href: "/login" },
    { label: "Hướng dẫn tham gia", href: "/guide" },
    { label: "Liên hệ hỗ trợ", href: "#" },
  ];

  return (
    <footer className="bg-[#07152a] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Logo + mô tả */}
          <div>
            <div className="mb-4">
              <Image
                src="/images/logo-bia-ha-long.png"
                alt="Bia Hạ Long"
                width={140}
                height={42}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-xs font-semibold text-[#c9a227] mb-2 uppercase tracking-wider">
              Cổng đấu thầu &amp; mua sắm nhà cung cấp
            </p>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Hệ thống quản lý đấu thầu và mua sắm nội bộ của Công ty Bia Hạ
              Long — minh bạch, hiệu quả, chuyên nghiệp.
            </p>
          </div>

          {/* Liên kết nhanh */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4">
              Liên kết nhanh
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-[#c9a227] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Thông tin liên hệ */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#c9a227]">✉</span>
                <span>procurement@biahalong.com.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#c9a227]">☎</span>
                <span>(0203) 383 4567</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#c9a227]">◎</span>
                <span>Lô 8 – KCN Việt Hưng, TP. Hạ Long, Quảng Ninh</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#c9a227]">◷</span>
                <span>Thứ 2 – Thứ 6, 08:00 – 17:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng copyright */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>
            © 2025 Công ty Bia Hạ Long. Bản quyền thuộc về Bia Hạ Long.
          </span>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white/60 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="#" className="hover:text-white/60 transition-colors">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Export chính ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryStats, setCategoryStats] = useState<CategorySummary[]>([]);
  const [latestTenders, setLatestTenders] = useState<Tender[]>([]);

  useEffect(() => {
    ensureCategorySeedData();
    ensureTenderSeedData();
    async function loadData() {
      const [tenders, categories] = await Promise.all([getTenders(), getPurchaseCategories()]);
      const activeCategories = categories.filter((category) => category.status === "Hoạt động");
      setCategoryStats(buildCategories(tenders, activeCategories));
      setLatestTenders(buildLatestOpenTenders(tenders));
    }
    loadData();
  }, []);

  function handleSearch() {
    const keyword = searchQuery.trim();
    router.push(keyword ? `/tenders?q=${encodeURIComponent(keyword)}` : "/tenders");
  }

  return (
    <div className="bg-white">
      <PublicHeader />
      <Hero searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} />
      <LatestTenders latestSix={latestTenders} />
      <Categories categories={categoryStats} />
      <Process />
      <Benefits />
      <FinalCTA />
      <Footer />
    </div>
  );
}
