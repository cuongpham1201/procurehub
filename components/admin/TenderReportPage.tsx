"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AdminTender } from "@/types/adminTender";
import type { SupplierBid } from "@/types/supplierBid";
import type { AwardItem } from "@/types/awardItem";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}
function fmtFull(n: number): string {
  return n > 0 ? n.toLocaleString("vi-VN") + " ₫" : "—";
}
function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso ?? "—"; }
}

// ── main component ────────────────────────────────────────────────────────────

interface Props { tenderId: string; }

interface ReportData {
  tender: AdminTender;
  bids: SupplierBid[];
  awardItems: AwardItem[];
}

export default function TenderReportPage({ tenderId }: Props) {
  const { user: session, loading: sessionLoading } = useCurrentUser();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoading) return;
    if (!session || session.kind !== "internal") { setLoading(false); return; }

    async function load() {
      try {
        const [tenderRes, bidsRes, awardsRes] = await Promise.all([
          fetch(`/api/tenders/${encodeURIComponent(tenderId)}`),
          fetch(`/api/bids?tenderId=${encodeURIComponent(tenderId)}`),
          fetch(`/api/award-items?tenderId=${encodeURIComponent(tenderId)}`),
        ]);
        if (!tenderRes.ok) throw new Error("Không thể tải gói thầu");
        const { data: tender } = await tenderRes.json();
        const { data: bids }   = await bidsRes.json();
        const { data: awards } = await awardsRes.json();
        setData({ tender, bids: bids ?? [], awardItems: awards ?? [] });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenderId, session, sessionLoading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
      Đang tải báo cáo...
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">{error}</div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
      Không có quyền xem báo cáo này.
    </div>
  );

  const { tender, bids, awardItems } = data;
  const wonBids = bids.filter((b) => b.status === "Được chọn");
  const totalAwarded = wonBids.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const savings = tender.estimatedValue > 0 ? tender.estimatedValue - totalAwarded : 0;
  const today = new Date().toLocaleDateString("vi-VN");

  // Group award items by supplier
  const bySupplier = new Map<string, { name: string; items: AwardItem[]; total: number }>();
  for (const a of awardItems) {
    const key = a.supplierId ?? a.supplierName ?? "unknown";
    if (!bySupplier.has(key)) bySupplier.set(key, { name: a.supplierName ?? key, items: [], total: 0 });
    const s = bySupplier.get(key)!;
    s.items.push(a);
    s.total += a.amount ?? 0;
  }

  // Build tender item name map from bids
  const itemNameMap = new Map<string, { name: string; unit: string }>();
  for (const bid of bids) {
    for (const bi of (bid.items ?? [])) {
      const key = bi.tenderItemId ?? bi.id;
      if (!itemNameMap.has(key)) itemNameMap.set(key, { name: bi.itemName, unit: bi.unit });
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-slate-800 text-white px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Quay lại
          </button>
          <span className="text-white/30">/</span>
          <span className="text-sm font-medium">Báo cáo kết quả: {tender.code}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/export/tenders/${tenderId}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Tải Excel
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In / Lưu PDF
          </button>
        </div>
      </div>

      {/* ── Report content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-10 print:px-0 print:py-0">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Công ty Cổ phần Bia Hạ Long
          </p>
          <h1 className="text-2xl font-bold text-[#0f2d5e] mb-1">
            BIÊN BẢN KẾT QUẢ XỬ LÝ BÁO GIÁ
          </h1>
          <p className="text-sm text-slate-500">Ngày lập: {today}</p>
        </div>

        {/* Tender info */}
        <section className="border border-slate-200 rounded-xl p-6 mb-6 print:border print:rounded-none">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
            I. Thông tin gói thầu
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ["Mã gói thầu", tender.code],
              ["Tên gói thầu", tender.title],
              ["Nhóm hàng", tender.category],
              ["Hạn nộp hồ sơ", fmtDate(tender.deadline)],
              ["Giá trị dự kiến", tender.estimatedValue > 0 ? fmtFull(tender.estimatedValue) : "—"],
              ["Trạng thái", tender.status],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-slate-400 shrink-0 w-36">{label}:</span>
                <span className="font-medium text-slate-800">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Số NCC tham gia", value: bids.length, color: "text-slate-800" },
            { label: "Tổng giá trị trúng thầu", value: fmtFull(totalAwarded), color: "text-[#0f2d5e] font-bold" },
            {
              label: savings > 0 ? "Tiết kiệm so với dự toán" : "So với giá trị dự kiến",
              value: savings > 0 ? fmtFull(savings) : "—",
              color: savings > 0 ? "text-emerald-600 font-bold" : "text-slate-400",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-slate-200 rounded-xl p-4 text-center print:border">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-lg ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* Award results by supplier */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            II. Kết quả chọn nhà cung cấp
          </h2>
          {bySupplier.size === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có kết quả chọn thầu.</p>
          ) : (
            <div className="space-y-4">
              {Array.from(bySupplier.values()).map((sup) => (
                <div key={sup.name} className="border border-slate-200 rounded-xl overflow-hidden print:border">
                  <div className="bg-[#0f2d5e] text-white px-4 py-2 flex items-center justify-between text-sm">
                    <span className="font-semibold">{sup.name}</span>
                    <span className="text-[#c9a227] font-bold">{fmtFull(sup.total)}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-medium text-slate-500">Tên mặt hàng</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500 w-16">SL</th>
                        <th className="text-left px-4 py-2 font-medium text-slate-500 w-14">ĐVT</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500 w-28">Đơn giá</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500 w-32">Thành tiền</th>
                        <th className="text-left px-4 py-2 font-medium text-slate-500">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sup.items.map((a) => {
                        const meta = itemNameMap.get(a.tenderItemId);
                        return (
                          <tr key={a.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-2 font-medium text-slate-800">{meta?.name ?? "—"}</td>
                            <td className="px-4 py-2 text-right text-slate-700">{a.quantity.toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-2 text-slate-500">{meta?.unit ?? "—"}</td>
                            <td className="px-4 py-2 text-right text-slate-700">{fmtFull(a.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-[#0f2d5e]">{fmtFull(a.amount)}</td>
                            <td className="px-4 py-2 text-slate-400">{a.note ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All participating bids */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            III. Danh sách nhà cung cấp tham gia
          </h2>
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden print:border">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-medium text-slate-500 w-8">STT</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500">Nhà cung cấp</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500">Mã báo giá</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-500">Tổng giá trị</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-500">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, i) => (
                <tr key={bid.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{bid.supplierName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{bid.bidCode}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtFull(bid.totalAmount ?? 0)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      bid.status === "Được chọn"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {bid.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Signature area */}
        <section className="mt-10 grid grid-cols-3 gap-8 text-center text-sm print:mt-16">
          {["Kế hoạch vật tư", "Trưởng phòng vật tư", "Ban giám đốc"].map((role) => (
            <div key={role}>
              <p className="font-semibold text-slate-700 mb-1">{role}</p>
              <p className="text-xs text-slate-400 italic mb-16">Ký, ghi rõ họ tên</p>
              <div className="border-t border-slate-300 pt-1 text-xs text-slate-400">Họ và tên</div>
            </div>
          ))}
        </section>

        <p className="text-center text-xs text-slate-300 mt-8 print:mt-4">
          Xuất từ hệ thống ProcureHub · {today}
        </p>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { font-size: 11pt; }
        }
      `}</style>
    </div>
  );
}
