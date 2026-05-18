"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminTenders, ensureTenderSeedData } from "@/services/tenderStorage";
import { getBids } from "@/services/supplierBidStorage";
import { ensureCategorySeedData, getPurchaseCategories } from "@/services/categoryStorage";
import { formatDisplayDate, toDateInputValue } from "@/services/dateUtils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AdminTender, AdminTenderStatus, AdminTenderCategory } from "@/types/adminTender";
import type { PurchaseCategory } from "@/types/category";

// ── helpers ───────────────────────────────────────────────────────────────

type TenderRow = {
  id: string;
  code: string;
  title: string;
  category: string;
  status: string;
  deadline: string;
  deadlineDisplay: string;
  createdAt: string;
  value: string;
  estimatedValue: number;
  bidCount: number;
};

type SortField = "code" | "title" | "category" | "status" | "deadline" | "estimatedValue" | "bidCount";
type SortDirection = "asc" | "desc";

function adminToRow(t: AdminTender, bidCount: number): TenderRow {
  return {
    id: t.id,
    code: t.code,
    title: t.title,
    category: t.category,
    status: t.status,
    deadline: t.deadline,
    deadlineDisplay: formatDisplayDate(t.deadline),
    createdAt: t.createdAt,
    value: t.estimatedValue > 0
      ? t.estimatedValue >= 1_000_000_000
        ? (t.estimatedValue / 1_000_000_000).toFixed(1) + " tỷ ₫"
        : (t.estimatedValue / 1_000_000).toFixed(0) + " triệu ₫"
      : "—",
    estimatedValue: t.estimatedValue,
    bidCount,
  };
}

function parseDateValue(value: string): number {
  const dateValue = toDateInputValue(value);
  const parsed = dateValue ? new Date(`${dateValue}T00:00:00`).getTime() : new Date(value).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function defaultDirectionFor(field: SortField): SortDirection {
  return field === "code" || field === "title" || field === "category" || field === "status" ? "asc" : "desc";
}

function compareRows(a: TenderRow, b: TenderRow, field: SortField): number {
  if (field === "deadline") {
    return parseDateValue(a.deadline) - parseDateValue(b.deadline);
  }
  if (field === "estimatedValue") return a.estimatedValue - b.estimatedValue;
  if (field === "bidCount") return a.bidCount - b.bidCount;
  return a[field].localeCompare(b[field], "vi", { sensitivity: "base", numeric: true });
}

const STATUS_COLORS: Record<string, string> = {
  "Nháp":            "bg-slate-100 text-slate-500",
  "Đang nhận báo giá":         "bg-green-100 text-green-700",
  "Đã đóng":         "bg-slate-200 text-slate-600",
  "Đang đánh giá":   "bg-blue-100 text-blue-700",
  "Đã có kết quả":   "bg-indigo-100 text-indigo-700",
  "Đã hủy":          "bg-red-100 text-red-500",
};

const STATUSES: (AdminTenderStatus | "")[] = [
  "", "Nháp", "Đang nhận báo giá", "Đã đóng", "Đang đánh giá", "Đã có kết quả", "Đã hủy",
];

// ── main component ────────────────────────────────────────────────────────

export default function AdminTendersPage() {
  const { user: currentUser } = useCurrentUser();
  const canCreate = (currentUser?.permissions ?? []).includes("tenders:write");
  const [rows, setRows] = useState<TenderRow[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<AdminTenderCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<AdminTenderStatus | "">("");
  const [sortField, setSortField] = useState<SortField>("deadline");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [categoryOptions, setCategoryOptions] = useState<PurchaseCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ensureCategorySeedData();
    ensureTenderSeedData();
    async function loadData() {
      const [categories, allTenders, bids] = await Promise.all([
        getPurchaseCategories(),
        getAdminTenders(),
        getBids(),
      ]);
      setCategoryOptions(categories.filter((category) => category.status === "Hoạt động"));
      const bidCountByTender = (tender: AdminTender) =>
        bids.filter(
          (b) =>
            b.tenderCode === tender.code ||
            b.tenderCode === tender.id ||
            b.tenderId === tender.id ||
            b.tenderId === tender.code
        ).length;
      setRows(allTenders.map((t) => adminToRow(t, bidCountByTender(t))));
      setLoaded(true);
    }
    loadData();
  }, []);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(defaultDirectionFor(field));
  }

  function SortHeader({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) {
    const active = sortField === field;
    return (
      <th className={`px-4 py-3 font-medium text-slate-500 whitespace-nowrap ${className}`}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
        >
          <span>{children}</span>
          <span className={`text-[10px] ${active ? "text-[#0f2d5e]" : "text-slate-300"}`}>
            {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    const matchCat = !catFilter || r.category === catFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const sortedRows = [...filtered].sort((a, b) => {
    const result = compareRows(a, b, sortField);
    if (result === 0 && sortField === "deadline") {
      const createdAtTie = parseDateValue(b.createdAt) - parseDateValue(a.createdAt);
      if (createdAtTie !== 0) return createdAtTie;
    }
    if (result === 0) return a.code.localeCompare(b.code, "vi", { numeric: true });
    return sortDirection === "asc" ? result : -result;
  });

  const total = rows.length;
  const open = rows.filter((r) => r.status === "Đang nhận báo giá").length;
  const closingSoon = rows.filter((r) => r.status === "Đã đóng").length;
  const draft = rows.filter((r) => r.status === "Nháp").length;
  const closed = rows.filter(
    (r) => r.status === "Đã đóng" || r.status === "Đang đánh giá"
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý gói thầu</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tạo, phát hành và theo dõi các gói thầu mua sắm.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/admin/tenders/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white text-sm font-medium rounded-lg hover:bg-[#0d2550] transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo gói thầu
          </Link>
        ) : (
          <span
            title="Bạn không có quyền tạo gói thầu"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white text-sm font-medium rounded-lg shrink-0 opacity-40 cursor-not-allowed select-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo gói thầu
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Tổng gói thầu", value: total, color: "text-[#0f2d5e]", bg: "bg-blue-50" },
          { label: "Đang nhận báo giá", value: open, color: "text-green-600", bg: "bg-green-50" },
          { label: "Đã đóng", value: closingSoon, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Nháp", value: draft, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Đã đóng / Đang đánh giá", value: closed, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm mã hoặc tên gói thầu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as AdminTenderCategory | "")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e]"
        >
          <option value="">Tất cả nhóm hàng</option>
          {categoryOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminTenderStatus | "")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e]"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {!loaded ? (
          <div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>
        ) : sortedRows.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-500">Không tìm thấy gói thầu phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <SortHeader field="code" className="text-left">Mã gói thầu</SortHeader>
                  <SortHeader field="title" className="text-left">Tên gói thầu</SortHeader>
                  <SortHeader field="category" className="text-left hidden md:table-cell">Nhóm hàng</SortHeader>
                  <SortHeader field="status" className="text-left">Trạng thái</SortHeader>
                  <SortHeader field="deadline" className="text-left hidden lg:table-cell">Hạn nộp</SortHeader>
                  <SortHeader field="estimatedValue" className="text-left hidden lg:table-cell">Giá trị</SortHeader>
                  <SortHeader field="bidCount" className="text-center hidden sm:table-cell">Báo giá</SortHeader>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {row.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 leading-tight line-clamp-2">{row.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 md:hidden">{row.category}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell whitespace-nowrap">{row.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell whitespace-nowrap">{row.deadlineDisplay}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell whitespace-nowrap">{row.value}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-xs font-medium ${row.bidCount > 0 ? "text-purple-600" : "text-slate-300"}`}>
                        {row.bidCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/tenders/${row.id}`}
                          className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                        >
                          Xem
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sortedRows.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {sortedRows.length} / {rows.length} gói thầu
        </p>
      )}
    </div>
  );
}
