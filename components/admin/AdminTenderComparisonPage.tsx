"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AdminTender } from "@/types/adminTender";
import type { SupplierBid, BidItem } from "@/types/supplierBid";
import type { AwardItem } from "@/types/awardItem";

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtVnd(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtUnit(n: number): string {
  return n.toLocaleString("vi-VN");
}

// ── types ──────────────────────────────────────────────────────────────────────

interface BidColumn {
  bid: SupplierBid;
  itemMap: Map<string, BidItem>; // keyed by tenderItemId
}

// ── loading skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-100 rounded w-1/3" />
      <div className="h-48 bg-slate-100 rounded" />
      <div className="h-64 bg-slate-100 rounded" />
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function AdminTenderComparisonPage({ tenderId }: { tenderId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [tender, setTender] = useState<AdminTender | null>(null);
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // tenderItemId being saved
  const [finalizing, setFinalizing] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes, aRes] = await Promise.all([
        fetch(`/api/tenders/${tenderId}`),
        fetch(`/api/bids?tenderId=${tenderId}`),
        fetch(`/api/award-items?tenderId=${tenderId}`),
      ]);
      if (!tRes.ok) throw new Error("Không tải được gói thầu");
      const tJson = await tRes.json();
      const bJson = bRes.ok ? await bRes.json() : { data: [] };
      const aJson = aRes.ok ? await aRes.json() : { data: [] };
      setTender(tJson.data);
      setBids(bJson.data ?? []);
      setAwards(aJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build per-bid columns (only bids that have items matching tender items)
  const columns: BidColumn[] = bids
    .filter((b) => b.items && b.items.length > 0 && b.status !== "Không được chọn")
    .map((bid) => {
      const itemMap = new Map<string, BidItem>();
      for (const item of (bid.items ?? [])) {
        if (item.tenderItemId) itemMap.set(item.tenderItemId, item);
      }
      return { bid, itemMap };
    });

  // award lookup by tenderItemId
  const awardMap = new Map<string, AwardItem>(awards.map((a) => [a.tenderItemId, a]));

  // Finalized = tender status "Đã có kết quả"
  const isFinalized = tender?.status === "Đã có kết quả";
  const isCancelled = tender?.status === "Đã hủy";
  const isPendingApproval = tender?.status === "Chờ phê duyệt";
  const canEvaluate = user?.permissions.includes("bids:evaluate") ?? false;
  // canAct controls select/deselect buttons in the matrix — only during "Đang đánh giá"
  const canAct = !isFinalized && !isCancelled && tender?.status === "Đang đánh giá";
  // canFinalize: TP/Admin can finalize from either "Đang đánh giá" or "Chờ phê duyệt"
  const canFinalize = canEvaluate && !isFinalized && !isCancelled && (tender?.status === "Đang đánh giá" || isPendingApproval);
  // canPropose: KHVT can propose when "Đang đánh giá"
  const canPropose = !canEvaluate && canAct;

  // Totals per bid column
  const bidTotals = columns.map(({ bid }) => {
    return awards
      .filter((a) => a.bidId === bid.id)
      .reduce((s, a) => s + a.amount, 0);
  });

  async function handleSelect(tenderItemId: string, col: BidColumn) {
    if (!canAct || saving) return;
    const tItem = tender!.items.find((i) => i.id === tenderItemId);
    const bidItem = col.itemMap.get(tenderItemId);
    setSaving(tenderItemId);
    try {
      const res = await fetch("/api/award-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenderId,
          tenderItemId,
          bidId: col.bid.id,
          bidItemId: bidItem?.id,
          supplierId: col.bid.supplierId,
          supplierName: col.bid.supplierName,
          unitPrice: bidItem?.unitPrice ?? 0,
          quantity: tItem?.quantity ?? bidItem?.quantity ?? 0,
          amount: bidItem?.amount ?? 0,
        }),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      const json = await res.json();
      setAwards((prev) => {
        const next = prev.filter((a) => a.tenderItemId !== tenderItemId);
        next.push(json.data);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeselect(tenderItemId: string) {
    if (!canAct || saving) return;
    const award = awardMap.get(tenderItemId);
    if (!award) return;
    setSaving(tenderItemId);
    try {
      await fetch(`/api/award-items/${award.id}`, { method: "DELETE" });
      setAwards((prev) => prev.filter((a) => a.tenderItemId !== tenderItemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại");
    } finally {
      setSaving(null);
    }
  }

  async function handleFinalize() {
    if (!canAct || finalizing) return;
    if (awards.length === 0) {
      setError("Vui lòng chọn nhà cung cấp cho ít nhất một mặt hàng trước khi chốt.");
      return;
    }
    const unselected = (tender?.items ?? []).filter((i) => !awardMap.has(i.id)).length;
    if (unselected > 0) {
      const confirmed = window.confirm(
        `Còn ${unselected} mặt hàng chưa chọn NCC. Bạn có muốn chốt kết quả ngay không?`,
      );
      if (!confirmed) return;
    }
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetch("/api/award-items/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chốt thất bại");
      setSuccessMsg(`Đã chốt kết quả: ${json.data.awardedItems} mặt hàng. Chuyển hướng...`);
      setTimeout(() => router.push(`/admin/tenders/${tenderId}`), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chốt thất bại");
    } finally {
      setFinalizing(false);
    }
  }

  async function handlePropose() {
    if (!canPropose || proposing) return;
    if (awards.length === 0) {
      setError("Vui lòng chọn nhà cung cấp cho ít nhất một mặt hàng trước khi đề xuất.");
      return;
    }
    const unselected = (tender?.items ?? []).filter((i) => !awardMap.has(i.id)).length;
    if (unselected > 0) {
      const confirmed = window.confirm(
        `Còn ${unselected} mặt hàng chưa chọn NCC. Bạn có muốn đề xuất kết quả ngay không?`,
      );
      if (!confirmed) return;
    }
    setProposing(true);
    setError(null);
    try {
      const res = await fetch("/api/award-items/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Đề xuất thất bại");
      setSuccessMsg("Đã đề xuất kết quả thành công. Gói thầu đang chờ phê duyệt từ Trưởng phòng vật tư.");
      setTender((prev) => prev ? { ...prev, status: "Chờ phê duyệt" } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đề xuất thất bại");
    } finally {
      setProposing(false);
    }
  }

  if (loading) return <div className="p-8"><Skeleton /></div>;
  if (!tender) return (
    <div className="p-8 text-center text-slate-500">
      Không tìm thấy gói thầu.{" "}
      <Link href="/admin/tenders" className="text-[#0f2d5e] underline">Quay lại</Link>
    </div>
  );

  const tenderItems = tender.items ?? [];
  const selectedCount = awards.length;
  const totalItems = tenderItems.length;

  return (
    <div className="space-y-5">

      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/admin/tenders" className="hover:text-slate-600">Gói thầu</Link>
          <span>›</span>
          <Link href={`/admin/tenders/${tender.id}`} className="hover:text-slate-600 font-mono">
            {tender.code}
          </Link>
          <span>›</span>
          <span className="text-slate-600">So sánh báo giá</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">So sánh báo giá</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tender.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFinalized && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">
                Đã chốt kết quả
              </span>
            )}
            {!isFinalized && canAct && (
              <span className="text-xs text-slate-500">
                {selectedCount}/{totalItems} mặt hàng đã chọn NCC
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}
      {isFinalized && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-3 text-sm">
          Gói thầu đã được chốt kết quả. Dữ liệu chỉ có thể xem.
        </div>
      )}
      {isPendingApproval && !canEvaluate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đề xuất đã được gửi. Đang chờ Trưởng phòng vật tư hoặc Admin phê duyệt và chốt kết quả.
        </div>
      )}
      {isPendingApproval && canEvaluate && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kết quả đề xuất đang chờ bạn phê duyệt. Xem lại bảng so sánh và nhấn &quot;Chốt kết quả&quot; để xác nhận.
        </div>
      )}

      {/* No valid bids */}
      {columns.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <p className="text-slate-500 text-sm font-medium mb-1">Chưa có báo giá hợp lệ để so sánh</p>
          <p className="text-slate-400 text-xs">
            Báo giá phải có chi tiết mặt hàng và không ở trạng thái &quot;Không được chọn&quot;.
          </p>
        </div>
      )}

      {/* No tender items */}
      {columns.length > 0 && tenderItems.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          Gói thầu này không có danh sách mặt hàng. Không thể so sánh theo dòng hàng.
        </div>
      )}

      {/* Matrix */}
      {columns.length > 0 && tenderItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Bảng so sánh theo mặt hàng
              <span className="ml-2 text-xs font-normal text-slate-400">
                {tenderItems.length} mặt hàng · {columns.length} NCC
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 + columns.length * 200 }}>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 min-w-[220px] sticky left-0 bg-slate-50/95 z-10">
                    Mặt hàng
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 px-4 py-3 w-16">
                    SL
                  </th>
                  {columns.map(({ bid }) => (
                    <th key={bid.id} className="text-center text-xs font-medium text-slate-400 px-4 py-3 min-w-[180px]">
                      <div className="font-semibold text-slate-700 truncate max-w-[160px] mx-auto">
                        {bid.supplierName}
                      </div>
                      <div className="font-mono text-slate-400 font-normal mt-0.5">{bid.bidCode}</div>
                    </th>
                  ))}
                  {canAct && (
                    <th className="text-center text-xs font-medium text-slate-400 px-4 py-3 w-32">
                      Đã chọn NCC
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tenderItems.map((tItem, idx) => {
                  const currentAward = awardMap.get(tItem.id);
                  const isSavingThis = saving === tItem.id;

                  // Find lowest unit price among bids that have this item
                  const prices = columns
                    .map(({ itemMap }) => itemMap.get(tItem.id)?.unitPrice ?? 0)
                    .filter((p) => p > 0);
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                  return (
                    <tr
                      key={tItem.id}
                      className={`border-b border-slate-50 last:border-0 ${
                        currentAward ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* Item info */}
                      <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            {tItem.materialCode && (
                              <div className="text-[10px] font-mono text-slate-400">{tItem.materialCode}</div>
                            )}
                            <div className="font-medium text-slate-800 text-sm leading-tight">{tItem.itemName}</div>
                            {tItem.specification && (
                              <div className="text-xs text-slate-400 leading-tight mt-0.5 truncate max-w-[180px]">
                                {tItem.specification}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                        {fmtUnit(tItem.quantity)}<br />
                        <span className="text-slate-400">{tItem.unit}</span>
                      </td>

                      {/* Per-supplier price cells */}
                      {columns.map(({ bid, itemMap }) => {
                        const bidItem = itemMap.get(tItem.id);
                        const isMin = bidItem && bidItem.unitPrice > 0 && bidItem.unitPrice === minPrice && prices.length > 1;
                        const isSelected = currentAward?.bidId === bid.id;
                        const isWinnerBid = bid.status === "Được chọn";

                        return (
                          <td
                            key={bid.id}
                            className={`px-4 py-3 text-center align-middle transition-colors ${
                              isSelected
                                ? "bg-emerald-50"
                                : isWinnerBid && isFinalized
                                ? "bg-emerald-50/40"
                                : ""
                            }`}
                          >
                            {bidItem ? (
                              <div className="space-y-1">
                                <div className={`font-semibold text-sm whitespace-nowrap ${isMin ? "text-emerald-700" : "text-slate-700"}`}>
                                  {bidItem.unitPrice > 0
                                    ? bidItem.unitPrice.toLocaleString("vi-VN") + " ₫"
                                    : "—"}
                                  {isMin && (
                                    <span className="ml-1 text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                      thấp nhất
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {bidItem.amount > 0 ? fmtVnd(bidItem.amount) : ""}
                                </div>
                                {bidItem.brand && (
                                  <div className="text-[11px] text-slate-400">{bidItem.brand}</div>
                                )}
                                {canAct && (
                                  <div className="pt-1">
                                    {isSelected ? (
                                      <button
                                        onClick={() => handleDeselect(tItem.id)}
                                        disabled={isSavingThis}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                      >
                                        ✓ Đã chọn
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSelect(tItem.id, { bid, itemMap })}
                                        disabled={isSavingThis || !!saving}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:border-[#0f2d5e] hover:text-[#0f2d5e] disabled:opacity-40 transition-colors"
                                      >
                                        Chọn NCC này
                                      </button>
                                    )}
                                  </div>
                                )}
                                {isFinalized && isSelected && (
                                  <div className="text-[11px] font-semibold text-emerald-700 mt-1">✓ Được chọn</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 italic">Không báo giá</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Selected supplier summary */}
                      {canAct && (
                        <td className="px-4 py-3 text-center">
                          {currentAward ? (
                            <div className="text-xs">
                              <div className="font-semibold text-emerald-700 truncate max-w-[120px] mx-auto">
                                {currentAward.supplierName}
                              </div>
                              <div className="text-slate-400 mt-0.5">
                                {currentAward.unitPrice > 0
                                  ? currentAward.unitPrice.toLocaleString("vi-VN") + " ₫"
                                  : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Chưa chọn</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Total row */}
                <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                  <td colSpan={2} className="px-4 py-3 text-right text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50/95">
                    Tổng giá trị được chọn
                  </td>
                  {columns.map(({ bid }, i) => (
                    <td key={bid.id} className="px-4 py-3 text-center">
                      {bidTotals[i] > 0 ? (
                        <span className="font-bold text-[#0f2d5e]">{fmtVnd(bidTotals[i])}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                  {canAct && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Propose action — KHVT (no bids:evaluate) */}
      {canPropose && columns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Đề xuất kết quả</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCount === totalItems
                ? `Tất cả ${totalItems} mặt hàng đã được chọn NCC. Sẵn sàng đề xuất.`
                : `${selectedCount}/${totalItems} mặt hàng đã chọn NCC. ${totalItems - selectedCount} mặt hàng chưa chọn.`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Sau khi đề xuất, Trưởng phòng vật tư hoặc Admin sẽ xem xét và chốt kết quả chính thức.
            </p>
          </div>
          <button
            onClick={handlePropose}
            disabled={proposing || selectedCount === 0}
            className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {proposing ? "Đang gửi..." : "Đề xuất kết quả"}
          </button>
        </div>
      )}

      {/* Finalize action — Trưởng phòng / Admin (has bids:evaluate) */}
      {canFinalize && columns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Chốt kết quả gói thầu</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCount === totalItems
                ? `Tất cả ${totalItems} mặt hàng đã được chọn NCC. Sẵn sàng chốt.`
                : `${selectedCount}/${totalItems} mặt hàng đã chọn NCC. ${totalItems - selectedCount} mặt hàng chưa chọn.`}
            </p>
            {isPendingApproval && (
              <p className="text-xs text-blue-600 font-medium mt-1">Kết quả đề xuất đang chờ phê duyệt.</p>
            )}
          </div>
          <button
            onClick={handleFinalize}
            disabled={finalizing || selectedCount === 0}
            className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#0f2d5e] text-white hover:bg-[#0d2550] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {finalizing ? "Đang chốt..." : "Chốt kết quả"}
          </button>
        </div>
      )}

      {/* Back link */}
      <div>
        <Link
          href={`/admin/tenders/${tender.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại chi tiết gói thầu
        </Link>
      </div>

    </div>
  );
}
