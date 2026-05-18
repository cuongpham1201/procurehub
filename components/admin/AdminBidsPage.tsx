"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBids, deleteBid } from "@/services/supplierBidStorage";
import type { SupplierBid, BidStatus } from "@/types/supplierBid";

// ── Status config ─────────────────────────────────────────────────────────────

const BID_STATUS_COLORS: Record<string, string> = {
  "Đã nộp":           "bg-blue-100 text-blue-700",
  "Đang xem xét":      "bg-amber-100 text-amber-700",
  "Cần làm rõ":      "bg-orange-100 text-orange-700",
  "Đã phản hồi":       "bg-teal-100 text-teal-700",
  "Được chọn":        "bg-emerald-100 text-emerald-700",
  "Không được chọn":  "bg-slate-100 text-slate-500",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVnd(value: number): string {
  if (!value || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " triệu ₫";
  return value.toLocaleString("vi-VN") + " ₫";
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function bidTotal(bid: SupplierBid): number {
  return bid.totalAmount ?? bid.totalPrice ?? 0;
}

function bidDate(bid: SupplierBid): string {
  return bid.submittedAt ?? bid.createdAt ?? "";
}

function bidTitle(bid: SupplierBid): string {
  return bid.tenderTitle ?? bid.tenderName ?? "—";
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent}`}>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

type SortField = "date" | "total" | "supplier" | "tender";
type SortDir = "asc" | "desc";

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1 text-[#0f2d5e]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

type QuickFilter = "all" | "pending" | BidStatus;

const NEEDS_ACTION_STATUSES: BidStatus[] = ["Cần làm rõ", "Đã phản hồi"];

export default function AdminBidsPage() {
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getBids().then(setBids);
  }, []);

  async function handleDelete(id: string) {
    await deleteBid(id);
    setBids(await getBids());
    setConfirmDeleteId(null);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const total = bids.length;
  const countNew = bids.filter((b) => b.status === "Đã nộp").length;
  const countReview = bids.filter((b) => b.status === "Đang xem xét").length;
  const countEval = bids.filter((b) => b.status === "Đề xuất chọn").length;
  const countChosen = bids.filter((b) => b.status === "Được chọn").length;
  const countPending = bids.filter((b) => (NEEDS_ACTION_STATUSES as string[]).includes(b.status)).length;

  const filtered = bids.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (b.supplierName ?? "").toLowerCase().includes(q) ||
      (b.tenderCode ?? "").toLowerCase().includes(q) ||
      (bidTitle(b)).toLowerCase().includes(q) ||
      (b.bidCode ?? b.id).toLowerCase().includes(q);
    const matchStatus =
      quickFilter === "all" ? true :
      quickFilter === "pending" ? (NEEDS_ACTION_STATUSES as string[]).includes(b.status) :
      b.status === quickFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") {
      cmp = (bidDate(a) || "").localeCompare(bidDate(b) || "");
    } else if (sortField === "total") {
      cmp = bidTotal(a) - bidTotal(b);
    } else if (sortField === "supplier") {
      cmp = (a.supplierName || "").localeCompare(b.supplierName || "", "vi");
    } else if (sortField === "tender") {
      cmp = bidTitle(a).localeCompare(bidTitle(b), "vi");
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Quản lý báo giá</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi, đánh giá và xử lý báo giá từ nhà cung cấp.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard label="Tổng báo giá" value={total} accent="border-slate-200" />
        <SummaryCard label="Báo giá mới" value={countNew} accent="border-blue-100" />
        <SummaryCard label="Đang xem xét" value={countReview} accent="border-amber-100" />
        <SummaryCard label="Đề xuất chọn" value={countEval} accent="border-indigo-100" />
        <SummaryCard label="Được chọn" value={countChosen} accent="border-emerald-100" />
      </div>

      {/* Confirm delete banner */}
      {confirmDeleteId && (() => {
        const target = bids.find((b) => b.id === confirmDeleteId);
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-800">Xác nhận xóa báo giá?</p>
              <p className="text-xs text-red-600 mt-0.5">
                {target ? `${target.bidCode ?? target.id} – ${target.supplierName}` : "Báo giá này"} sẽ bị xóa khỏi hệ thống.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        );
      })()}

      {/* Quick filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {([
          { key: "all",     label: "Tất cả",      count: total },
          { key: "pending", label: "Cần xử lý",   count: countPending, accent: true },
          { key: "Đã nộp",  label: "Mới nộp",     count: countNew },
          { key: "Đang xem xét",  label: "Đang xem xét",  count: countReview },
          { key: "Đề xuất chọn", label: "Đề xuất chọn",  count: countEval },
          { key: "Được chọn",    label: "Được chọn",      count: countChosen },
        ] as { key: QuickFilter; label: string; count: number; accent?: boolean }[]).map(({ key, label, count, accent }) => (
          <button
            key={key}
            onClick={() => setQuickFilter(key)}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              quickFilter === key
                ? accent
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-[#0f2d5e] border-[#0f2d5e] text-white"
                : accent && count > 0
                  ? "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
                  : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            {label}
            {count > 0 && (
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                quickFilter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên NCC, mã báo giá, mã hoặc tên gói thầu..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IconInbox />
            <p className="text-slate-500 font-medium mt-4">
              {bids.length === 0 ? "Chưa có báo giá nào được nộp." : "Không tìm thấy báo giá phù hợp."}
            </p>
            {bids.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">Báo giá từ nhà cung cấp sẽ hiển thị ở đây.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Mã báo giá</th>
                  <th
                    className="text-left text-xs font-semibold text-slate-500 px-4 py-3 cursor-pointer hover:text-slate-700 whitespace-nowrap select-none"
                    onClick={() => handleSort("supplier")}
                  >
                    Nhà cung cấp<SortIcon field="supplier" current={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="text-left text-xs font-semibold text-slate-500 px-4 py-3 cursor-pointer hover:text-slate-700 whitespace-nowrap select-none"
                    onClick={() => handleSort("tender")}
                  >
                    Gói thầu<SortIcon field="tender" current={sortField} dir={sortDir} />
                  </th>
                  <th
                    className="text-right text-xs font-semibold text-slate-500 px-4 py-3 cursor-pointer hover:text-slate-700 whitespace-nowrap select-none"
                    onClick={() => handleSort("total")}
                  >
                    Tổng giá trị<SortIcon field="total" current={sortField} dir={sortDir} />
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Dòng hàng</th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Trạng thái</th>
                  <th
                    className="text-left text-xs font-semibold text-slate-500 px-4 py-3 cursor-pointer hover:text-slate-700 whitespace-nowrap select-none"
                    onClick={() => handleSort("date")}
                  >
                    Ngày nộp<SortIcon field="date" current={sortField} dir={sortDir} />
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((bid) => {
                  const statusCls = BID_STATUS_COLORS[bid.status] ?? "bg-slate-100 text-slate-500";
                  const itemCount = bid.items?.length ?? 0;
                  const date = bidDate(bid);
                  return (
                    <tr key={bid.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {bid.bidCode ?? bid.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 truncate max-w-[160px]">{bid.supplierName || "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-mono text-slate-400">{bid.tenderCode}</p>
                        <p className="text-slate-700 truncate max-w-[180px]">{bidTitle(bid)}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-[#0f2d5e] whitespace-nowrap">
                        {formatVnd(bidTotal(bid))}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {itemCount > 0
                          ? <span className="text-slate-600">{itemCount}</span>
                          : bid.items === undefined
                            ? <span className="text-xs text-slate-400 italic">Dữ liệu cũ</span>
                            : <span className="text-slate-300">0</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusCls}`}>
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {date ? formatDate(date) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/admin/bids/${bid.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0f2d5e] border border-[#0f2d5e]/20 px-2.5 py-1.5 rounded-lg hover:bg-[#0f2d5e] hover:text-white transition-colors whitespace-nowrap"
                          >
                            <IconEye />
                            Xem
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(bid.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors whitespace-nowrap"
                          >
                            <IconTrash />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Hiển thị {filtered.length} / {bids.length} báo giá
          {" "}· Sắp xếp theo{" "}
          {sortField === "date" ? "ngày nộp" : sortField === "total" ? "tổng giá trị" : sortField === "supplier" ? "nhà cung cấp" : "gói thầu"}
          {" "}{sortDir === "desc" ? "↓" : "↑"}
        </p>
      )}
    </div>
  );
}
