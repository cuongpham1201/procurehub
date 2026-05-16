"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getBidsBySupplier } from "@/services/supplierBidStorage";
import type { SupplierBid, BidItem } from "@/types/supplierBid";
import type { BidClarification } from "@/types/bidClarification";

// ── helpers ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function bidTotal(bid: SupplierBid): number {
  return bid.totalAmount ?? bid.totalPrice ?? 0;
}

function bidDate(bid: SupplierBid): string {
  return bid.submittedAt ?? bid.createdAt ?? "";
}

function bidCode(bid: SupplierBid): string {
  return bid.bidCode ?? bid.id;
}

function bidTitle(bid: SupplierBid): string {
  return bid.tenderTitle ?? bid.tenderName ?? "—";
}

// ── status badge ───────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  "Đã nộp":            "bg-blue-100 text-blue-700",
  "Đang xem xét":      "bg-amber-100 text-amber-700",
  "Đã phản hồi":       "bg-teal-100 text-teal-700",
  "Đề xuất chọn":      "bg-indigo-100 text-indigo-700",
  "Cần làm rõ":        "bg-orange-100 text-orange-700",
  "Được chọn":         "bg-emerald-100 text-emerald-700",
  "Không được chọn":   "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLS[status] ?? STATUS_CLS["Đã nộp"];
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// ── items table ────────────────────────────────────────────────────────────
function BidItemsTable({ items }: { items: BidItem[] | undefined }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">Dữ liệu báo giá cũ chưa có chi tiết mặt hàng.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ minWidth: 600 }}>
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-7">STT</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2">Tên hàng</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-12">SL</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-12">ĐVT</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-[100px]">Đơn giá</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-[110px]">Thành tiền</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-[90px]">Thương hiệu</th>
            <th className="text-left font-medium text-slate-400 py-2 w-[80px]">Xuất xứ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
              <td className="py-2 pr-2 font-medium text-slate-800">{item.itemName}</td>
              <td className="py-2 pr-2 text-right text-slate-700">{item.quantity.toLocaleString("vi-VN")}</td>
              <td className="py-2 pr-2 text-slate-500">{item.unit}</td>
              <td className="py-2 pr-2 text-right text-slate-700">
                {item.unitPrice > 0 ? item.unitPrice.toLocaleString("vi-VN") + " ₫" : "—"}
              </td>
              <td className="py-2 pr-2 text-right font-semibold text-[#0f2d5e]">
                {item.amount > 0 ? fmt(item.amount) : "—"}
              </td>
              <td className="py-2 pr-2 text-slate-500">{item.brand || "—"}</td>
              <td className="py-2 text-slate-500">{item.origin || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200">
            <td colSpan={5} className="py-2 pr-2 text-right font-semibold text-slate-600">Tổng</td>
            <td className="py-2 pr-2 text-right font-bold text-[#0f2d5e]">
              {fmt(items.reduce((s, it) => s + (it.amount ?? 0), 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── not-logged-in ──────────────────────────────────────────────────────────
function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f2d5e] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Bia Hạ Long <span className="text-[#c9a227]">Procurement</span>
          </Link>
        </div>
      </header>
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Bạn chưa đăng nhập</h2>
          <p className="text-sm text-slate-500 mb-6">Đăng nhập để xem danh sách báo giá đã nộp.</p>
          <Link
            href="/login"
            className="inline-block bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function SupplierBidsPage() {
  const { user: session, loading: sessionLoading } = useCurrentUser();
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Clarification state
  const [clarificationsMap, setClarificationsMap] = useState<Record<string, BidClarification[]>>({});
  const [clarifyResponseNote, setClarifyResponseNote] = useState<Record<string, string>>({});
  const [clarifySubmitting, setClarifySubmitting] = useState<Record<string, boolean>>({});
  const [clarifyError, setClarifyError] = useState<Record<string, string>>({});
  const loggedIn = !sessionLoading && session?.kind === "supplier";
  const companyName = session?.name ?? "";

  useEffect(() => {
    if (sessionLoading) return;
    async function loadData() {
      if (!session || session.kind !== "supplier") { setLoading(false); return; }
      const myBids = await getBidsBySupplier(session.id);
      setBids(myBids.slice().sort((a, b) => (bidDate(b)).localeCompare(bidDate(a))));
      setLoading(false);
    }
    loadData();
  }, [session, sessionLoading]);

  async function loadClarifications(bidId: string) {
    if (clarificationsMap[bidId]) return; // already loaded
    try {
      const res = await fetch(`/api/bids/${encodeURIComponent(bidId)}/clarifications`);
      const json = await res.json();
      setClarificationsMap((prev) => ({ ...prev, [bidId]: json.data ?? [] }));
    } catch {
      setClarificationsMap((prev) => ({ ...prev, [bidId]: [] }));
    }
  }

  function handleExpand(bidId: string, hasClarification: boolean) {
    const next = expandedId === bidId ? null : bidId;
    setExpandedId(next);
    if (next && hasClarification) loadClarifications(bidId);
  }

  async function handleRespond(bidId: string, clarificationId: string) {
    const note = clarifyResponseNote[clarificationId]?.trim();
    if (!note) return;
    setClarifySubmitting((prev) => ({ ...prev, [clarificationId]: true }));
    setClarifyError((prev) => ({ ...prev, [clarificationId]: "" }));
    try {
      const res = await fetch(
        `/api/bids/${encodeURIComponent(bidId)}/clarifications/${encodeURIComponent(clarificationId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseNote: note }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gửi phản hồi thất bại");
      // Update clarification in map
      setClarificationsMap((prev) => ({
        ...prev,
        [bidId]: (prev[bidId] ?? []).map((c) => (c.id === clarificationId ? json.data : c)),
      }));
      // Clear response input
      setClarifyResponseNote((prev) => ({ ...prev, [clarificationId]: "" }));
      // Update bid status locally
      setBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: "Đã phản hồi" } : b));
    } catch (err) {
      setClarifyError((prev) => ({
        ...prev,
        [clarificationId]: err instanceof Error ? err.message : "Lỗi không xác định",
      }));
    } finally {
      setClarifySubmitting((prev) => ({ ...prev, [clarificationId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    );
  }
  if (!loggedIn) return <NotLoggedIn />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f2d5e] text-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Bia Hạ Long <span className="text-[#c9a227]">Procurement</span>
            </Link>
            <span className="hidden sm:block text-white/30">/</span>
            <span className="hidden sm:block text-sm text-white/70">Báo giá đã nộp</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden md:block truncate max-w-[180px]">{companyName}</span>
            <Link
              href="/supplier/dashboard"
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              ← Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0f2d5e]">Báo giá đã nộp</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {bids.length > 0 ? `${bids.length} báo giá` : "Chưa có báo giá nào"}
            </p>
          </div>
          <Link
            href="/tenders"
            className="text-sm font-semibold bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] px-4 py-2 rounded-lg transition-colors"
          >
            Xem gói thầu mới
          </Link>
        </div>

        {bids.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <h2 className="text-base font-semibold text-slate-600 mb-2">Chưa có báo giá nào</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
              Bạn chưa nộp báo giá cho gói thầu nào.
            </p>
            <Link
              href="/tenders"
              className="inline-block bg-[#0f2d5e] hover:bg-[#0a1e3d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Xem gói thầu đang mở
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const isExpanded = expandedId === bid.id;
              const itemCount = bid.items?.length ?? 0;
              const needsClarification = bid.status === "Cần làm rõ";
              const bidClarifications = clarificationsMap[bid.id] ?? [];
              const pendingClarification = bidClarifications.find((c) => c.status === "pending");
              return (
                <div
                  key={bid.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                    needsClarification ? "border-orange-200" : "border-slate-100"
                  }`}
                >
                  {/* Clarification alert banner */}
                  {needsClarification && (
                    <div className="flex items-center gap-3 bg-orange-50 px-5 py-3 border-b border-orange-200">
                      <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-medium text-orange-800 flex-1">
                        Báo giá này cần được làm rõ — mở chi tiết để xem yêu cầu và gửi phản hồi.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-semibold text-[#0f2d5e]">{bidCode(bid)}</span>
                        <StatusBadge status={bid.status} />
                      </div>
                      <p className="font-medium text-slate-800 truncate">{bidTitle(bid)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {bid.tenderCode} · {bidDate(bid) ? fmtDate(bidDate(bid)) : "—"}
                        {itemCount > 0 && ` · ${itemCount} dòng hàng`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0f2d5e]">{fmt(bidTotal(bid))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tenders/${bid.tenderId}`}
                        className="text-xs font-medium text-[#0f2d5e] border border-[#0f2d5e]/20 px-3 py-1.5 rounded-lg hover:bg-[#0f2d5e]/5 transition-colors whitespace-nowrap"
                      >
                        Xem gói thầu
                      </Link>
                      {(itemCount > 0 || needsClarification) && (
                        <button
                          onClick={() => handleExpand(bid.id, needsClarification)}
                          className={`text-xs font-medium border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap ${
                            needsClarification
                              ? "text-orange-600 border-orange-300 hover:bg-orange-50"
                              : "text-slate-500 border-slate-200"
                          }`}
                        >
                          {isExpanded ? "Thu gọn ▲" : needsClarification ? "Phản hồi ▼" : "Chi tiết ▼"}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40 space-y-4">

                      {/* Clarification panel */}
                      {needsClarification && (
                        <div className="bg-white border border-orange-200 rounded-xl p-4 space-y-4">
                          <h3 className="text-sm font-semibold text-orange-800">Yêu cầu làm rõ từ ban mua sắm</h3>

                          {bidClarifications.length === 0 && (
                            <p className="text-xs text-slate-400 italic">Đang tải yêu cầu...</p>
                          )}

                          {bidClarifications.map((c) => (
                            <div key={c.id} className="space-y-3">
                              {/* Request note */}
                              <div className="flex gap-3">
                                <div className="w-1.5 rounded-full bg-orange-400 shrink-0 mt-1" style={{ minHeight: 32 }} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-xs font-semibold text-orange-700">Yêu cầu từ {c.requestedByName}</span>
                                    <span className="text-xs text-slate-400">{new Date(c.requestedAt).toLocaleString("vi-VN")}</span>
                                  </div>
                                  <p className="text-sm text-slate-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">
                                    {c.requestNote}
                                  </p>
                                </div>
                              </div>

                              {/* Response (already submitted) */}
                              {c.status === "responded" && c.responseNote && (
                                <div className="flex gap-3 pl-4">
                                  <div className="w-1.5 rounded-full bg-teal-400 shrink-0 mt-1" style={{ minHeight: 32 }} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-teal-700">Phản hồi của bạn</span>
                                      {c.respondedAt && (
                                        <span className="text-xs text-slate-400">{new Date(c.respondedAt).toLocaleString("vi-VN")}</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">
                                      {c.responseNote}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Response form — only for pending clarifications */}
                              {c.status === "pending" && (
                                <div className="pl-4">
                                  <p className="text-xs font-medium text-slate-600 mb-2">Phản hồi của bạn</p>
                                  <textarea
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                    rows={4}
                                    placeholder="Nhập phản hồi của bạn cho yêu cầu này..."
                                    value={clarifyResponseNote[c.id] ?? ""}
                                    onChange={(e) =>
                                      setClarifyResponseNote((prev) => ({ ...prev, [c.id]: e.target.value }))
                                    }
                                  />
                                  {clarifyError[c.id] && (
                                    <p className="text-xs text-red-600 mt-1">{clarifyError[c.id]}</p>
                                  )}
                                  <button
                                    onClick={() => handleRespond(bid.id, c.id)}
                                    disabled={!clarifyResponseNote[c.id]?.trim() || clarifySubmitting[c.id]}
                                    className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                                  >
                                    {clarifySubmitting[c.id] ? "Đang gửi..." : "Gửi phản hồi"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Fallback if no clarifications loaded yet but bid is in "Cần làm rõ" */}
                          {bidClarifications.length === 0 && pendingClarification === undefined && (
                            <p className="text-xs text-orange-700">
                              Vui lòng liên hệ ban mua sắm nếu không thấy nội dung yêu cầu.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bid commercial terms */}
                      {bid.deliveryTime && (
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Giao hàng:</span> {bid.deliveryTime}
                          {bid.paymentTerms && <> · <span className="font-medium">Thanh toán:</span> {bid.paymentTerms}</>}
                          {bid.warrantyPolicy && <> · <span className="font-medium">Bảo hành:</span> {bid.warrantyPolicy}</>}
                        </p>
                      )}

                      {itemCount > 0 && <BidItemsTable items={bid.items} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/supplier/dashboard" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Quay lại portal
          </Link>
        </div>
      </div>
    </div>
  );
}
