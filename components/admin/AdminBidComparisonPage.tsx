"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getTenders,
  ensureTenderSeedData,
  updateAdminTenderStatus,
} from "@/services/tenderStorage";
import { getBids, markBidAsWinner } from "@/services/supplierBidStorage";
import { getInternalSession } from "@/services/authStorage";
import { addAdminActivityLog, actorFromSession } from "@/services/activityStorage";
import { formatDisplayDate } from "@/services/dateUtils";
import type { AdminTender } from "@/types/adminTender";
import type { SupplierBid } from "@/types/supplierBid";

// ── helpers ────────────────────────────────────────────────────────────────
function fmtVnd(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function getBidTotal(b: SupplierBid): number {
  return b.totalAmount ?? b.totalPrice ?? 0;
}

function getBidDate(b: SupplierBid): string {
  return b.submittedAt ?? b.createdAt ?? "";
}

function getBidCode(b: SupplierBid): string {
  return b.bidCode ?? b.id;
}

function getBidTitle(b: SupplierBid): string {
  return b.tenderTitle ?? b.tenderName ?? "—";
}

// ── status colours ─────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  "Đã nộp":           "bg-blue-100 text-blue-700",
  "Chờ xem xét":      "bg-amber-100 text-amber-700",
  "Đang đánh giá":    "bg-indigo-100 text-indigo-700",
  "Cần bổ sung":      "bg-orange-100 text-orange-700",
  "Được chọn":        "bg-emerald-100 text-emerald-700",
  "Không được chọn":  "bg-slate-100 text-slate-500",
};

const TENDER_STATUS_CLS: Record<string, string> = {
  "Đang mở":        "bg-green-100 text-green-700",
  "Sắp đóng":       "bg-orange-100 text-orange-700",
  "Đã đóng":        "bg-slate-100 text-slate-500",
  "Đang đánh giá":  "bg-indigo-100 text-indigo-700",
  "Đã có kết quả":  "bg-purple-100 text-purple-700",
  "Nháp":           "bg-gray-100 text-gray-500",
  "Đã hủy":         "bg-red-100 text-red-600",
};

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const cls = map[status] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

// ── summary card ───────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  accent = "border-slate-200",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${accent}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-base font-bold text-slate-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

// ── section wrapper ────────────────────────────────────────────────────────
function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function AdminBidComparisonPage() {
  const searchParams = useSearchParams();
  const [allTenders, setAllTenders] = useState<AdminTender[]>([]);
  const [allBids, setAllBids] = useState<SupplierBid[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderSearch, setTenderSearch] = useState("");
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    ensureTenderSeedData();
    const tenders = getTenders();
    const bids = getBids();
    setAllTenders(tenders);
    setAllBids(bids);
    // Support deep-link from tender detail page
    const preselect = searchParams.get("tenderId");
    if (preselect) setSelectedTenderId(preselect);
  }, [searchParams]);

  // ── derived ──────────────────────────────────────────────────────────────
  const { tendersWithBids, filteredTenders, waitingTenders } = useMemo(() => {
    // Only show "Đang đánh giá" tenders that have at least one bid with items
    const withBids = allTenders.filter(
      (t) =>
        t.status === "Đang đánh giá" &&
        allBids.some((b) => b.tenderId === t.id && b.items && b.items.length > 0)
    );
    // Hint: tenders that have bids but are not yet in "Đang đánh giá"
    const waiting = allTenders.filter(
      (t) =>
        (t.status === "Đã đóng" || t.status === "Đang mở") &&
        allBids.some((b) => b.tenderId === t.id)
    );
    const q = tenderSearch.toLowerCase().trim();
    const filtered = q
      ? withBids.filter(
          (t) =>
            t.code.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q)
        )
      : withBids;
    return { tendersWithBids: withBids, filteredTenders: filtered, waitingTenders: waiting };
  }, [allTenders, allBids, tenderSearch]);

  const selectedTender = useMemo(
    () => allTenders.find((t) => t.id === selectedTenderId) ?? null,
    [allTenders, selectedTenderId]
  );

  const { bidsForTender, bidsWithItems, hasLegacyBids } = useMemo(() => {
    const forTender = allBids.filter((b) => b.tenderId === selectedTenderId);
    const withItems = forTender.filter((b) => b.items && b.items.length > 0);
    const legacy = forTender.some((b) => !b.items || b.items.length === 0);
    return { bidsForTender: forTender, bidsWithItems: withItems, hasLegacyBids: legacy };
  }, [allBids, selectedTenderId]);

  const stats = useMemo(() => {
    if (bidsWithItems.length === 0) return null;
    const totals = bidsWithItems.map((b) => getBidTotal(b));
    const minVal = Math.min(...totals);
    const maxVal = Math.max(...totals);
    const minBid = bidsWithItems.find((b) => getBidTotal(b) === minVal) ?? null;
    return { minVal, maxVal, diff: maxVal - minVal, minBid };
  }, [bidsWithItems]);

  // ── handlers ─────────────────────────────────────────────────────────────
  function handleSelectWinner(bidId: string) {
    const winnerBid = allBids.find((b) => b.id === bidId);
    markBidAsWinner(bidId, selectedTenderId);
    updateAdminTenderStatus(selectedTenderId, "Đã có kết quả");
    addAdminActivityLog({
      type: "winner_selected",
      title: "Đã chốt kết quả gói thầu",
      description: `Chọn ${winnerBid?.supplierName ?? "—"} cho gói ${selectedTender?.code ?? ""} – ${selectedTender?.title ?? ""}`,
      entityType: "tender",
      entityId: selectedTenderId,
      entityCode: selectedTender?.code,
      ...actorFromSession(getInternalSession()),
    });
    const freshBids = getBids();
    const freshTenders = getTenders();
    setAllBids(freshBids);
    setAllTenders(freshTenders);
    setConfirmBidId(null);
    setSelectedTenderId("");
    setSuccessMsg("Đã chốt kết quả gói thầu.");
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  // ── render ────────────────────────────────────────────────────────────────
  const isCancelled = selectedTender?.status === "Đã hủy";
  const isResult = selectedTender?.status === "Đã có kết quả";
  const canSelect = !isCancelled && !isResult && bidsWithItems.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">So sánh báo giá</h1>
        <p className="text-sm text-slate-500 mt-1">
          So sánh đơn giá, thành tiền và điều kiện thương mại giữa các nhà cung cấp.
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Tender selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Chọn gói thầu để so sánh</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative sm:w-72">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={tenderSearch}
              onChange={(e) => setTenderSearch(e.target.value)}
              placeholder="Tìm theo mã / tên gói thầu..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors"
            />
          </div>
          <select
            value={selectedTenderId}
            onChange={(e) => {
              setSelectedTenderId(e.target.value);
              setConfirmBidId(null);
              setSuccessMsg("");
            }}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/10 transition-colors bg-white"
          >
            <option value="">-- Chọn gói thầu --</option>
            {filteredTenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} – {t.title}
              </option>
            ))}
          </select>
        </div>
        {tendersWithBids.length === 0 && waitingTenders.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Chưa có gói thầu nào ở trạng thái Đang đánh giá có báo giá hợp lệ.
          </p>
        )}
        {tendersWithBids.length === 0 && waitingTenders.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-semibold mb-1">
              Có {waitingTenders.length} gói thầu đã có báo giá nhưng chưa ở trạng thái Đang đánh giá:
            </p>
            <ul className="text-xs text-blue-600 space-y-0.5">
              {waitingTenders.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/tenders/${t.id}`} className="hover:underline font-medium">
                    {t.code} – {t.title}
                  </Link>
                  {" "}
                  <span className="text-blue-400">({t.status})</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-blue-500 mt-1.5">Chuyển gói thầu sang "Đang đánh giá" để bắt đầu so sánh.</p>
          </div>
        )}
        {tendersWithBids.length > 0 && filteredTenders.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">Không tìm thấy gói thầu phù hợp.</p>
        )}
      </div>

      {/* Empty state — no tender selected */}
      {!selectedTenderId && (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Chưa chọn gói thầu</p>
          <p className="text-xs text-slate-400">Chọn một gói thầu để bắt đầu so sánh báo giá.</p>
        </div>
      )}

      {/* Main content — tender selected */}
      {selectedTender && (
        <>
          {/* Tender info card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-slate-400">{selectedTender.code}</span>
                  <StatusBadge status={selectedTender.status} map={TENDER_STATUS_CLS} />
                </div>
                <h2 className="text-base font-bold text-[#0f2d5e] leading-snug">{selectedTender.title}</h2>
              </div>
              <div className="flex flex-wrap gap-6 text-sm shrink-0">
                {[
                  { label: "Hạn nộp", value: formatDisplayDate(selectedTender.deadline) },
                  { label: "Số báo giá", value: `${bidsForTender.length} báo giá` },
                  {
                    label: "Giá trị dự kiến",
                    value:
                      selectedTender.estimatedValue >= 1_000_000_000
                        ? (selectedTender.estimatedValue / 1_000_000_000).toFixed(1) + " tỷ ₫"
                        : selectedTender.estimatedValue >= 1_000_000
                        ? (selectedTender.estimatedValue / 1_000_000).toFixed(0) + " triệu ₫"
                        : selectedTender.estimatedValue > 0
                        ? fmtVnd(selectedTender.estimatedValue)
                        : "Chưa xác định",
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link
                href={`/admin/tenders/${selectedTender.id}`}
                className="text-xs font-medium text-[#0f2d5e] hover:underline"
              >
                Xem chi tiết gói thầu →
              </Link>
            </div>
          </div>

          {/* Banners */}
          {hasLegacyBids && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
              Một số báo giá cũ chưa có chi tiết mặt hàng nên không được đưa vào bảng so sánh.
            </div>
          )}

          {isResult && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 rounded-xl px-4 py-3 text-sm">
              Gói thầu đã có kết quả. Nếu cần thay đổi, vui lòng xử lý thủ công trong dữ liệu test.
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              Gói thầu đã hủy. Không thể chọn nhà cung cấp.
            </div>
          )}

          {/* Empty — no valid bids */}
          {bidsForTender.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
              <p className="text-sm text-slate-500">Gói thầu này chưa có báo giá để so sánh.</p>
            </div>
          )}

          {/* Content when bids exist */}
          {bidsWithItems.length === 0 && bidsForTender.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu chi tiết mặt hàng để so sánh.
              </p>
            </div>
          )}

          {bidsWithItems.length > 0 && (
            <>
              {/* Summary cards */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <SummaryCard
                    label="Số NCC đã báo giá"
                    value={`${bidsWithItems.length}`}
                    accent="border-slate-200"
                  />
                  <SummaryCard
                    label="Giá thấp nhất"
                    value={fmtVnd(stats.minVal)}
                    sub={stats.minBid?.supplierName}
                    accent="border-emerald-200"
                  />
                  <SummaryCard
                    label="Giá cao nhất"
                    value={fmtVnd(stats.maxVal)}
                    accent="border-red-100"
                  />
                  <SummaryCard
                    label="Chênh lệch"
                    value={fmtVnd(stats.diff)}
                    accent="border-amber-100"
                  />
                  <SummaryCard
                    label="NCC giá thấp nhất"
                    value={stats.minBid?.supplierName ?? "—"}
                    sub={getBidCode(stats.minBid!)}
                    accent="border-emerald-100"
                  />
                </div>
              )}

              {/* Section 1: Tổng hợp theo NCC */}
              <Section
                title="Tổng hợp báo giá theo nhà cung cấp"
                badge={
                  <span className="text-xs text-slate-400">{bidsWithItems.length} báo giá</span>
                }
              >
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm" style={{ minWidth: 860 }}>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-4 min-w-[140px]">Nhà cung cấp</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-4 w-[110px]">Mã báo giá</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-4 w-[90px]">Ngày nộp</th>
                        <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-4 w-[130px]">Tổng giá trị</th>
                        <th className="text-center text-xs font-medium text-slate-400 py-2.5 pr-4 w-[90px]">Trạng thái</th>
                        <th className="text-center text-xs font-medium text-slate-400 py-2.5 pr-4 w-16">Dòng</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-4 w-[140px]">Thanh toán</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-4 w-[120px]">Giao hàng</th>
                        {canSelect && (
                          <th className="text-center text-xs font-medium text-slate-400 py-2.5 w-[120px]">Thao tác</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {bidsWithItems
                        .slice()
                        .sort((a, b) => getBidTotal(a) - getBidTotal(b))
                        .map((bid) => {
                          const total = getBidTotal(bid);
                          const isMin = stats ? total === stats.minVal : false;
                          const isWinner = bid.status === "Được chọn";
                          const isConfirming = confirmBidId === bid.id;
                          const date = getBidDate(bid);
                          return (
                            <tr
                              key={bid.id}
                              className={`border-b border-slate-50 last:border-0 transition-colors ${
                                isWinner
                                  ? "bg-emerald-50/60"
                                  : isMin && !isResult
                                  ? "bg-green-50/40"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-medium text-slate-800 truncate max-w-[130px]">
                                    {bid.supplierName}
                                  </span>
                                  {isMin && bidsWithItems.length > 1 && (
                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 whitespace-nowrap">
                                      Giá thấp nhất
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 pr-4">
                                <span className="font-mono text-xs text-slate-500">{getBidCode(bid)}</span>
                              </td>
                              <td className="py-3.5 pr-4 text-xs text-slate-500 whitespace-nowrap">
                                {date ? fmtDate(date) : "—"}
                              </td>
                              <td className="py-3.5 pr-4 text-right">
                                <span className={`font-bold whitespace-nowrap ${isMin ? "text-green-700" : "text-[#0f2d5e]"}`}>
                                  {fmtVnd(total)}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4 text-center">
                                <StatusBadge status={bid.status} map={STATUS_CLS} />
                              </td>
                              <td className="py-3.5 pr-4 text-center text-slate-600 text-xs">
                                {bid.items?.length ?? "—"}
                              </td>
                              <td className="py-3.5 pr-4 text-xs text-slate-600 max-w-[140px] truncate">
                                {bid.paymentTerms || "—"}
                              </td>
                              <td className="py-3.5 pr-4 text-xs text-slate-600 max-w-[120px] truncate">
                                {bid.deliveryTime || "—"}
                              </td>
                              {canSelect && (
                                <td className="py-3.5 text-center">
                                  {isConfirming ? (
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <button
                                        onClick={() => handleSelectWinner(bid.id)}
                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap"
                                      >
                                        Xác nhận
                                      </button>
                                      <button
                                        onClick={() => setConfirmBidId(null)}
                                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmBidId(bid.id)}
                                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e] hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      Đề xuất chọn
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Inline confirm hint */}
                {confirmBidId && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    Xác nhận chọn nhà cung cấp{" "}
                    <span className="font-semibold">
                      {bidsWithItems.find((b) => b.id === confirmBidId)?.supplierName}
                    </span>{" "}
                    cho gói thầu{" "}
                    <span className="font-semibold">{selectedTender.code}</span>?{" "}
                    Các báo giá còn lại sẽ chuyển sang "Không được chọn" và gói thầu sẽ cập nhật thành "Đã có kết quả".
                  </div>
                )}
              </Section>

              {/* Section 2: So sánh theo từng mặt hàng */}
              <Section
                title="So sánh theo từng mặt hàng"
                badge={
                  <span className="text-xs text-slate-400">
                    {selectedTender.items.length} mặt hàng
                  </span>
                }
              >
                {selectedTender.items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    Gói thầu này không có danh sách mặt hàng.
                  </p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {selectedTender.items.map((tItem, itemIdx) => {
                      // Collect bid items for this tender item
                      const bidRows = bidsWithItems
                        .map((bid) => {
                          const found = bid.items?.find(
                            (it) => it.tenderItemId === tItem.id
                          );
                          return found ? { bid, bidItem: found } : null;
                        })
                        .filter((x): x is { bid: SupplierBid; bidItem: NonNullable<typeof x>["bidItem"] } => x !== null)
                        .sort((a, b) => a.bidItem.unitPrice - b.bidItem.unitPrice);

                      const minUnitPrice =
                        bidRows.length > 0
                          ? Math.min(...bidRows.map((r) => r.bidItem.unitPrice))
                          : 0;

                      return (
                        <div key={tItem.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          {/* Item header */}
                          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#0f2d5e]/10 text-[#0f2d5e] text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {itemIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-slate-800 text-sm">{tItem.itemName}</span>
                              {tItem.specification && (
                                <span className="ml-2 text-xs text-slate-500">{tItem.specification}</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {tItem.quantity.toLocaleString("vi-VN")} {tItem.unit}
                            </span>
                          </div>

                          {/* Bid comparison table */}
                          {bidRows.length === 0 ? (
                            <p className="text-xs text-slate-400 px-4 py-3 italic">
                              Chưa có báo giá cho mặt hàng này.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs" style={{ minWidth: 600 }}>
                                <thead>
                                  <tr className="border-b border-slate-100">
                                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 min-w-[140px]">Nhà cung cấp</th>
                                    <th className="text-right font-medium text-slate-400 px-4 py-2.5 w-[110px]">Đơn giá</th>
                                    <th className="text-right font-medium text-slate-400 px-4 py-2.5 w-[110px]">Thành tiền</th>
                                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 w-[100px]">Thương hiệu</th>
                                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 w-[80px]">Xuất xứ</th>
                                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 w-[100px]">Giao hàng</th>
                                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 w-[100px]">Ghi chú</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bidRows.map(({ bid, bidItem }) => {
                                    const isItemMin =
                                      bidRows.length > 1 &&
                                      bidItem.unitPrice === minUnitPrice;
                                    const isWinner = bid.status === "Được chọn";
                                    return (
                                      <tr
                                        key={bid.id}
                                        className={`border-b border-slate-50 last:border-0 ${
                                          isWinner
                                            ? "bg-emerald-50/50"
                                            : isItemMin
                                            ? "bg-green-50/40"
                                            : ""
                                        }`}
                                      >
                                        <td className="px-4 py-2.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-medium text-slate-800 truncate max-w-[120px]">
                                              {bid.supplierName}
                                            </span>
                                            {isItemMin && bidRows.length > 1 && (
                                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 whitespace-nowrap">
                                                Thấp nhất
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className={`font-semibold whitespace-nowrap ${isItemMin ? "text-green-700" : "text-slate-700"}`}>
                                            {bidItem.unitPrice > 0
                                              ? bidItem.unitPrice.toLocaleString("vi-VN") + " ₫"
                                              : "—"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-[#0f2d5e] whitespace-nowrap">
                                          {bidItem.amount > 0 ? fmtVnd(bidItem.amount) : "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                          {bidItem.brand || "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                          {bidItem.origin || "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                          {bidItem.deliveryTime || bid.deliveryTime || "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-400">
                                          {bidItem.note || "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            </>
          )}
        </>
      )}
    </div>
  );
}
