"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getTenders, ensureTenderSeedData, adminToPublicTender } from "@/services/tenderStorage";
import { ensureCategorySeedData, getPurchaseCategories } from "@/services/categoryStorage";
import { getInternalSession } from "@/services/authStorage";
import { getCurrentSession } from "@/services/supplierAccountStorage";
import { getBidsBySupplier } from "@/services/supplierBidStorage";
import type { Tender, TenderCategory, TenderStatus } from "@/types/tender";
import type { PurchaseCategory } from "@/types/category";
import TenderCard from "./TenderCard";
import PublicHeader from "@/components/shared/PublicHeader";

type UserType = "loading" | "guest" | "supplier" | "internal";

// ─── Hằng số cho filter ───────────────────────────────────────────────────────

const STATUSES_OPEN: Array<{ value: TenderStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Đang mở", label: "Đang mở" },
  { value: "Sắp đóng", label: "Sắp đóng" },
];

const STATUSES_ALL: Array<{ value: TenderStatus | ""; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Đang mở", label: "Đang mở" },
  { value: "Sắp đóng", label: "Sắp đóng" },
  { value: "Đã đóng", label: "Đã đóng" },
  { value: "Đã có kết quả", label: "Đã có kết quả" },
];

// ─── Icon tìm kiếm ────────────────────────────────────────────────────────────

function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
        <IconSearch size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        Không tìm thấy gói thầu phù hợp
      </h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">
        {hasFilters
          ? "Thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem tất cả gói thầu."
          : "Hiện chưa có gói thầu nào trong hệ thống."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-5 py-2 text-sm font-medium text-[#0f2d5e] border border-[#0f2d5e]/30 rounded-lg hover:bg-[#0f2d5e] hover:text-white transition-colors"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────────────────────────────

export default function TenderListPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TenderCategory | "">("");
  const [status, setStatus] = useState<TenderStatus | "">("");
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<PurchaseCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userType, setUserType] = useState<UserType>("loading");

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    ensureCategorySeedData();
    ensureTenderSeedData();
    async function loadData() {
      const categories = await getPurchaseCategories();
      setCategoryOptions(categories.filter((item) => item.status === "Hoạt động"));

      const internalUser = getInternalSession();
      const supplierUser = getCurrentSession();

      const allAdmin = (await getTenders()).filter(
        (t) => t.status !== "Nháp" && t.status !== "Đã hủy"
      );

      if (internalUser) {
        setUserType("internal");
        setTenders(allAdmin.map(adminToPublicTender));
      } else if (supplierUser) {
        setUserType("supplier");
        const bids = await getBidsBySupplier(supplierUser.id);
        const bidTenderIds = new Set(bids.map((b) => b.tenderId));
        const visible = allAdmin.filter(
          (t) =>
            t.status === "Đang mở" ||
            t.status === "Sắp đóng" ||
            bidTenderIds.has(t.id)
        );
        setTenders(visible.map(adminToPublicTender));
      } else {
        setUserType("guest");
        const visible = allAdmin.filter(
          (t) => t.status === "Đang mở" || t.status === "Sắp đóng"
        );
        setTenders(visible.map(adminToPublicTender));
      }

      setLoaded(true);
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tenders.filter((t) => {
      const matchSearch =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchCategory = category === "" || t.category === category;
      const matchStatus = status === "" || t.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [search, category, status, tenders]);

  const hasActiveFilters = search !== "" || category !== "" || status !== "";

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Tiêu đề trang + breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              Trang chủ
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-medium">Gói thầu</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">
            Danh sách gói thầu
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Tra cứu các gói thầu mua sắm nguyên vật liệu, máy móc, thiết bị,
            công cụ dụng cụ và dịch vụ của Bia Hạ Long.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Khu vực bộ lọc */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Ô tìm kiếm */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <IconSearch />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên, mã hoặc nhóm hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-800 border border-slate-300 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors placeholder-slate-400"
              />
              {/* Nút xóa search */}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <IconX />
                </button>
              )}
            </div>

            {/* Filter nhóm hàng */}
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as TenderCategory | "")
              }
              className="sm:w-52 px-3 py-2.5 text-sm text-slate-700 border border-slate-300 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors bg-white cursor-pointer"
            >
              <option value="">Tất cả nhóm hàng</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter trạng thái */}
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TenderStatus | "")
              }
              className="sm:w-48 px-3 py-2.5 text-sm text-slate-700 border border-slate-300 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors bg-white cursor-pointer"
            >
              {(userType === "internal" || userType === "supplier" ? STATUSES_ALL : STATUSES_OPEN).map((s) => (
                <option key={s.label} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dòng kết quả + nút xóa lọc */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">
            {filtered.length === 0
              ? "Không có kết quả"
              : `Hiển thị ${filtered.length} / ${tenders.length} gói thầu`}
            {hasActiveFilters && (
              <span className="ml-1 text-[#0f2d5e] font-medium">(đã lọc)</span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <IconX size={13} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Danh sách card hoặc empty state */}
        {!loaded ? (
          <div className="py-20 text-center text-sm text-slate-400">Đang tải...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((tender) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </div>
        ) : (
          <EmptyState onClear={clearFilters} hasFilters={hasActiveFilters} />
        )}
      </div>
    </div>
  );
}
