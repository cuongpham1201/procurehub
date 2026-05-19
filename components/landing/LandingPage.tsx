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
    case "Pallet và vật tư kho":
      return <IconBox />;
    case "Logistics và vận tải":
      return <IconUsers />;
    case "Đồng phục và bảo hộ lao động":
      return <IconUsers />;
    case "Bảo trì và nâng hạ":
      return <IconWrench />;
    case "Thiết bị CNTT":
      return <IconMonitor />;
    case "Nguyên vật liệu đóng gói":
      return <IconBox />;
    case "Dịch vụ vệ sinh và phụ trợ":
      return <IconUsers />;
    default:
      return <IconBox />;
  }
}

// ─── Màu badge trạng thái ─────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
  "Đang nhận báo giá": "bg-green-100 text-green-700",
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

function normalizeCategoryKey(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^demo-\s*/i, "");
}

function buildCategories(tenders: AdminTender[], categories: PurchaseCategory[]): CategorySummary[] {
  return categories.map((category) => ({
    code: category.code,
    name: category.name,
    count: tenders.filter((t) => {
      const tenderCategory = normalizeCategoryKey(t.category);
      const categoryName = normalizeCategoryKey(category.name);
      const categoryCode = normalizeCategoryKey(category.code);
      return tenderCategory !== "" && (tenderCategory === categoryName || tenderCategory === categoryCode);
    }).length,
  }));
}

function buildLatestOpenTenders(tenders: AdminTender[]): Tender[] {
  return [...tenders]
    .sort((a, b) => {
      const deadlineDiff = parseDateTime(a.deadline) - parseDateTime(b.deadline);
      if (deadlineDiff !== 0) return deadlineDiff;
      return parseDateTime(b.createdAt) - parseDateTime(a.createdAt);
    })
    .slice(0, 6)
    .map(adminToPublicTender);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_METRICS = [
  {
    value: "120+",
    label: "Gói thầu mỗi năm",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c9a227" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    value: "850+",
    label: "Nhà cung cấp",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c9a227" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: "100%",
    label: "Quy trình minh bạch",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c9a227" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    value: "5.000+",
    label: "Tỷ ₫ giá trị mua sắm",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c9a227" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function HeroMetricsPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl px-7 py-5 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5 ${className}`}
      style={{
        background: "rgba(5,14,30,0.58)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {HERO_METRICS.map((m) => (
        <div key={m.label} className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(201,162,39,0.14)" }}
          >
            {m.icon}
          </div>
          <div>
            <div
              className="text-[21px] font-bold leading-none tracking-tight tabular-nums"
              style={{ color: "#c9a227" }}
            >
              {m.value}
            </div>
            <div className="text-white/55 text-[11.5px] mt-1 leading-tight">{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
      className="relative overflow-hidden"
      style={{ background: "#07152b", minHeight: 820 }}
    >
      {/* ── Background: pre-processed cinematic image — show at near full opacity ── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src="/images/cover nha may.png"
          alt=""
          fill
          className="object-cover object-center"
          style={{ opacity: 0.96 }}
          priority
        />
      </div>

      {/* ── Overlay 1: Minimal left reinforcement for text contrast ──────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(6,16,36,0.55) 0%, rgba(6,16,36,0.38) 30%, rgba(6,16,36,0.08) 55%, transparent 72%)",
        }}
      />

      {/* ── Overlay 2: Subtle bottom-to-top fade — smooth section transition ─── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "36%",
          background: "linear-gradient(to top, rgba(6,16,36,0.85) 0%, rgba(6,16,36,0.22) 50%, transparent 100%)",
        }}
      />

      {/* ── Gold accent line — top ────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
        style={{
          background: "linear-gradient(to right, #c9a227 0%, rgba(201,162,39,0.45) 38%, transparent 58%)",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-8 lg:px-[80px] xl:px-[112px]">
        <div className="pt-28 lg:pt-36 pb-20 lg:pb-28">
          <div className="max-w-[620px]">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "#c9a227" }}
              />
              <span className="text-white/72 text-[12px] font-medium tracking-wide">
                Hệ thống đấu thầu nội bộ của Bia Hạ Long
              </span>
            </div>

            {/* Main heading */}
            <h1
              className="font-bold leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(44px, 5.5vw, 66px)", letterSpacing: "-0.025em" }}
            >
              <span className="text-white block">Cổng đấu thầu</span>
              <span className="text-white block">&amp; mua sắm</span>
              <span style={{ color: "#c9a227" }}>Bia Hạ Long</span>
            </h1>

            {/* Description */}
            <p className="text-white/72 text-[16px] lg:text-[17px] leading-relaxed mb-10 max-w-[540px]">
              Minh bạch hóa quy trình mua sắm nguyên vật liệu, máy móc và dịch vụ —
              kết nối Bia Hạ Long với các nhà cung cấp uy tín, đảm bảo
              công bằng và hiệu quả.
            </p>

            {/* Search bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); onSearch(); }}
              className="mb-8"
            >
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{
                  background: "white",
                  maxWidth: 580,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.10)",
                }}
              >
                <div className="pl-5 pr-2 text-slate-400 shrink-0">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Tìm gói thầu theo tên, mã, nhóm hàng…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-[20px] px-2 text-[14px] text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="shrink-0 px-7 py-[20px] text-[14px] font-semibold transition-colors whitespace-nowrap"
                  style={{ background: "#c9a227", color: "#0a1e3d" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#b8960c")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#c9a227")}
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tenders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: "#c9a227",
                  color: "#0a1e3d",
                  boxShadow: "0 4px 20px rgba(201,162,39,0.38)",
                }}
              >
                Xem gói thầu đang mở
                <IconChevronRight />
              </Link>
              <Link
                href="/supplier/register-account"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Đăng ký nhà cung cấp
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  color: "rgba(255,255,255,0.60)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>

        {/* ── Mobile metrics panel (in-flow) ───────────────────────────────────── */}
        <div className="lg:hidden pb-10">
          <HeroMetricsPanel />
        </div>
      </div>

      {/* ── Desktop metrics panel: absolute bottom-right ─────────────────────── */}
      <div className="hidden lg:block absolute bottom-0 inset-x-0 z-20 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-[80px] xl:px-[112px] pb-10">
          <div className="flex justify-end pointer-events-auto">
            <HeroMetricsPanel className="w-[56%] xl:w-[52%]" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Feature strip — sits directly below the hero ────────────────────────────

function FeatureStrip() {
  const features = [
    {
      title: "Minh bạch & công bằng",
      desc: "Mọi gói thầu đều được công bố công khai, quy trình xét duyệt nhất quán và có lưu vết.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Quản lý tập trung",
      desc: "Toàn bộ gói thầu, nhà cung cấp, báo giá và lịch sử giao dịch trên một nền tảng duy nhất.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      title: "So sánh & đánh giá",
      desc: "So sánh báo giá nhiều nhà cung cấp trực quan, hỗ trợ quyết định mua sắm tối ưu chi phí.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Bảo mật dữ liệu",
      desc: "Hệ thống nội bộ, phân quyền chặt chẽ. Chỉ nhà cung cấp được duyệt mới có thể truy cập thầu.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`flex items-start gap-4 px-5 py-6 rounded-xl transition-colors hover:bg-slate-50 ${
                i < features.length - 1 ? "lg:border-r lg:border-slate-100" : ""
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#0f2d5e]"
                style={{ background: "rgba(201,162,39,0.10)" }}
              >
                {f.icon}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800 mb-1">{f.title}</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
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
      const openTenders = tenders.filter((t) => t.status === "Đang nhận báo giá");
      setCategoryStats(buildCategories(openTenders, activeCategories));
      setLatestTenders(buildLatestOpenTenders(openTenders));
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
      <FeatureStrip />
      <LatestTenders latestSix={latestTenders} />
      <Categories categories={categoryStats} />
      <Process />
      <Benefits />
      <FinalCTA />
      <Footer />
    </div>
  );
}
