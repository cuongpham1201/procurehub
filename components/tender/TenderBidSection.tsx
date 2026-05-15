"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { SupplierBid, BidItem } from "@/types/supplierBid";

// ── helpers ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

// ── status badge ───────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  "Đã nộp":          "bg-blue-100 text-blue-700",
  "Chờ xem xét":     "bg-amber-100 text-amber-700",
  "Đang đánh giá":   "bg-indigo-100 text-indigo-700",
  "Cần bổ sung":     "bg-orange-100 text-orange-700",
  "Đã bổ sung":      "bg-teal-100 text-teal-700",
  "Được chọn":       "bg-emerald-100 text-emerald-700",
  "Không được chọn": "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLS[status] ?? STATUS_CLS["Đã nộp"];
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  );
}

// ── items table ────────────────────────────────────────────────────────────
function BidItemsTable({ items }: { items: BidItem[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic py-2">
        Dữ liệu báo giá cũ chưa có chi tiết mặt hàng.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ minWidth: 700 }}>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-7">STT</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 min-w-[110px]">Tên hàng</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-[110px]">Quy cách</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-12">SL</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-12">ĐVT</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-[110px]">Đơn giá</th>
            <th className="text-right font-medium text-slate-400 py-2 pr-2 w-[110px]">Thành tiền</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-[90px]">Thương hiệu</th>
            <th className="text-left font-medium text-slate-400 py-2 pr-2 w-[80px]">Xuất xứ</th>
            <th className="text-left font-medium text-slate-400 py-2 w-[90px]">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
              <td className="py-2 pr-2 font-medium text-slate-800">{item.itemName}</td>
              <td className="py-2 pr-2 text-slate-500">{item.specification || "—"}</td>
              <td className="py-2 pr-2 text-right text-slate-700 font-medium">
                {item.quantity.toLocaleString("vi-VN")}
              </td>
              <td className="py-2 pr-2 text-slate-500">{item.unit}</td>
              <td className="py-2 pr-2 text-right font-medium text-slate-700">
                {item.unitPrice > 0 ? item.unitPrice.toLocaleString("vi-VN") + " ₫" : "—"}
              </td>
              <td className="py-2 pr-2 text-right font-semibold text-[#0f2d5e]">
                {item.amount > 0 ? fmt(item.amount) : "—"}
              </td>
              <td className="py-2 pr-2 text-slate-500">{item.brand || "—"}</td>
              <td className="py-2 pr-2 text-slate-500">{item.origin || "—"}</td>
              <td className="py-2 text-slate-400">{item.note || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50/60">
            <td colSpan={6} className="py-2 pr-2 text-right font-semibold text-slate-600">
              Tổng
            </td>
            <td className="py-2 pr-2 text-right font-bold text-[#0f2d5e]">
              {fmt(items.reduce((s, it) => s + (it.amount ?? 0), 0))}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── info row ───────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-slate-400 w-36 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-700 flex-1">{value ?? "—"}</span>
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

// ── supplier view: my bid ──────────────────────────────────────────────────
function MyBidSection({ bid }: { bid: SupplierBid }) {
  const total = bid.totalAmount ?? bid.totalPrice ?? 0;
  const date = bid.submittedAt ?? bid.createdAt ?? "";
  const code = bid.bidCode ?? bid.id;

  return (
    <Section title="Báo giá của bạn" badge={<StatusBadge status={bid.status} />}>
      <div className="space-y-2 mb-5">
        <InfoRow
          label="Mã báo giá"
          value={<span className="font-mono font-semibold text-[#0f2d5e]">{code}</span>}
        />
        {date && <InfoRow label="Ngày nộp" value={fmtDate(date)} />}
        <InfoRow
          label="Tổng giá trị"
          value={
            <span className="font-bold text-base text-[#0f2d5e]">{fmt(total)}</span>
          }
        />
        {bid.deliveryTime && <InfoRow label="Thời gian giao hàng" value={bid.deliveryTime} />}
        {bid.paymentTerms && <InfoRow label="Điều kiện thanh toán" value={bid.paymentTerms} />}
        {bid.warrantyPolicy && <InfoRow label="Bảo hành" value={bid.warrantyPolicy} />}
        {bid.note && <InfoRow label="Ghi chú" value={bid.note} />}
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Chi tiết mặt hàng
        </p>
        <BidItemsTable items={bid.items} />
      </div>
    </Section>
  );
}

// ── internal view: all bids for tender ────────────────────────────────────
function AllBidsSection({ bids, tenderId }: { bids: SupplierBid[]; tenderId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (bids.length === 0) {
    return (
      <Section title="Báo giá nhà cung cấp">
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Chưa có nhà cung cấp nào nộp báo giá cho gói thầu này.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Báo giá nhà cung cấp"
      badge={
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0f2d5e]/10 text-[#0f2d5e]">
          {bids.length} báo giá
        </span>
      }
    >
      <div className="space-y-2">
        {bids.map((bid) => {
          const isExpanded = expandedId === bid.id;
          const total = bid.totalAmount ?? bid.totalPrice ?? 0;
          const date = bid.submittedAt ?? bid.createdAt ?? "";
          const code = bid.bidCode ?? bid.id;
          const itemCount = bid.items?.length ?? 0;

          return (
            <div key={bid.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#0f2d5e]">{code}</span>
                    <StatusBadge status={bid.status} />
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate mt-0.5">
                    {bid.supplierName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {date ? fmtDate(date) : "—"} ·{" "}
                    {itemCount > 0 ? `${itemCount} dòng hàng` : "Không có chi tiết"}
                  </p>
                </div>
                <div className="text-right mr-2">
                  <p className="font-bold text-[#0f2d5e] text-sm">{fmt(total)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/bids/${bid.id}`}
                    className="text-xs font-medium text-[#0f2d5e] border border-[#0f2d5e]/20 px-2.5 py-1.5 rounded-lg hover:bg-[#0f2d5e] hover:text-white transition-colors whitespace-nowrap"
                  >
                    Xem chi tiết
                  </Link>
                  {itemCount > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : bid.id)}
                      className="text-xs font-medium text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      {isExpanded ? "Thu gọn ▲" : "Chi tiết ▼"}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40">
                  <BidItemsTable items={bid.items} />
                  {bid.deliveryTime && (
                    <p className="text-xs text-slate-500 mt-3">
                      <span className="font-medium">Giao hàng:</span> {bid.deliveryTime}
                      {bid.paymentTerms && (
                        <>
                          {" · "}
                          <span className="font-medium">Thanh toán:</span> {bid.paymentTerms}
                        </>
                      )}
                    </p>
                  )}
                  {bid.note && (
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium">Ghi chú:</span> {bid.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── main export ────────────────────────────────────────────────────────────
export default function TenderBidSection({ tenderId }: { tenderId: string }) {
  const { user, loading: authLoading } = useCurrentUser();
  const [allBids, setAllBids] = useState<SupplierBid[]>([]);
  const [myBid, setMyBid] = useState<SupplierBid | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    setDataLoading(true);
    fetch(`/api/bids?tenderId=${encodeURIComponent(tenderId)}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then(({ data }) => {
        const bids = (data ?? []) as SupplierBid[];
        if (user.kind === "internal") {
          setAllBids(bids);
        } else if (user.kind === "supplier") {
          // API already filters to own bids; find the one for this tender
          setMyBid(
            bids.find((b) => b.tenderId === tenderId) ?? null,
          );
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user, authLoading, tenderId]);

  // Guests and loading: render nothing
  if (authLoading || dataLoading || !user) return null;

  if (user.kind === "internal") {
    return <AllBidsSection bids={allBids} tenderId={tenderId} />;
  }

  if (user.kind === "supplier" && myBid) {
    return <MyBidSection bid={myBid} />;
  }

  return null;
}
