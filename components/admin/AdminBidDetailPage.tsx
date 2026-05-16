"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBidById, updateBidStatus, deleteBid } from "@/services/supplierBidStorage";
import { getAccounts } from "@/services/supplierAccountStorage";
import type { SupplierBid, BidItem, BidStatus } from "@/types/supplierBid";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { BidClarification } from "@/types/bidClarification";
import type { Upload } from "@/types/upload";
import { FileList } from "@/components/ui/FileList";

// ── Status config ─────────────────────────────────────────────────────────────

const BID_STATUS_COLORS: Record<string, string> = {
  "Đã nộp":           "bg-blue-100 text-blue-700 border-blue-200",
  "Đang xem xét":      "bg-amber-100 text-amber-700 border-amber-200",
  "Cần làm rõ":      "bg-orange-100 text-orange-700 border-orange-200",
  "Đã phản hồi":       "bg-teal-100 text-teal-700 border-teal-200",
  "Được chọn":        "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Không được chọn":  "bg-slate-100 text-slate-500 border-slate-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVnd(value: number): string {
  if (!value || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " triệu ₫";
  return value.toLocaleString("vi-VN") + " ₫";
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString("vi-VN"); } catch { return iso; }
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

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7l-5-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v4a2 2 0 002 2h4" />
    </svg>
  );
}

// ── Section / InfoRow ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2.5 border-b border-slate-50 last:border-0">
      <div className="sm:w-44 text-xs font-medium text-slate-400 flex-shrink-0 mb-0.5 sm:mb-0 sm:pt-0.5">
        {label}
      </div>
      <div className="text-sm text-slate-700 flex-1">{value ?? "—"}</div>
    </div>
  );
}

// ── Items table ───────────────────────────────────────────────────────────────

function BidItemsTable({ items }: { items: BidItem[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-400 italic">
        Dữ liệu báo giá cũ chưa có chi tiết mặt hàng.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 700 }}>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-8">STT</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 min-w-[120px]">Tên hàng</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[120px]">Quy cách</th>
            <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-3 w-14">SL</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-14">ĐVT</th>
            <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-3 w-[120px]">Đơn giá</th>
            <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-3 w-[120px]">Thành tiền</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[100px]">Thương hiệu</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[80px]">Xuất xứ</th>
            <th className="text-left text-xs font-medium text-slate-400 py-2.5 w-[100px]">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className="border-b border-slate-50 last:border-0">
              <td className="py-3 pr-3 text-xs text-slate-400">{i + 1}</td>
              <td className="py-3 pr-3 font-medium text-slate-800">{item.itemName}</td>
              <td className="py-3 pr-3 text-slate-500 text-xs leading-relaxed">{item.specification || "—"}</td>
              <td className="py-3 pr-3 text-right font-semibold text-slate-700 whitespace-nowrap text-xs">
                {item.quantity.toLocaleString("vi-VN")}
              </td>
              <td className="py-3 pr-3 text-slate-500 text-xs whitespace-nowrap">{item.unit}</td>
              <td className="py-3 pr-3 text-right text-slate-700 text-xs whitespace-nowrap">
                {item.unitPrice > 0 ? item.unitPrice.toLocaleString("vi-VN") + " ₫" : "—"}
              </td>
              <td className="py-3 pr-3 text-right font-semibold text-[#0f2d5e] text-xs whitespace-nowrap">
                {item.amount > 0 ? formatVnd(item.amount) : "—"}
              </td>
              <td className="py-3 pr-3 text-slate-500 text-xs">{item.brand || "—"}</td>
              <td className="py-3 pr-3 text-slate-500 text-xs">{item.origin || "—"}</td>
              <td className="py-3 text-slate-400 text-xs">{item.note || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50/60">
            <td colSpan={6} className="py-3 pr-3 text-right text-xs font-semibold text-slate-600">Tổng giá trị</td>
            <td className="py-3 pr-3 text-right font-bold text-[#0f2d5e]">
              {formatVnd(items.reduce((s, it) => s + (it.amount ?? 0), 0))}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Action buttons ────────────────────────────────────────────────────────────

interface ActionBtn { label: string; status: BidStatus; style: string; }

function getActions(current: BidStatus): ActionBtn[] {
  switch (current) {
    case "Đã nộp":
      return [{ label: "Bắt đầu xem xét", status: "Đang xem xét", style: "bg-amber-500 hover:bg-amber-600 text-white" }];
    case "Đang xem xét":
      return [
        { label: "Chuyển sang đánh giá", status: "Đang xem xét", style: "bg-indigo-600 hover:bg-indigo-700 text-white" },
        { label: "Yêu cầu bổ sung", status: "Cần làm rõ", style: "bg-orange-500 hover:bg-orange-600 text-white" },
        { label: "Không chọn", status: "Không được chọn", style: "bg-slate-500 hover:bg-slate-600 text-white" },
      ];
    case "Đang xem xét":
      return [
        { label: "Yêu cầu bổ sung", status: "Cần làm rõ", style: "bg-orange-500 hover:bg-orange-600 text-white" },
        { label: "Không chọn", status: "Không được chọn", style: "bg-slate-500 hover:bg-slate-600 text-white" },
      ];
    case "Cần làm rõ":
      return [{ label: "Tiếp tục xem xét", status: "Đang xem xét", style: "bg-amber-500 hover:bg-amber-600 text-white" }];
    case "Đã phản hồi":
      return [{ label: "Chuyển sang đánh giá", status: "Đang xem xét", style: "bg-indigo-600 hover:bg-indigo-700 text-white" }];
    default:
      return [];
  }
}

// ── Not found ─────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300">
        <IconFile />
      </div>
      <h2 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy báo giá</h2>
      <p className="text-sm text-slate-400 mb-6">Báo giá này không tồn tại hoặc đã bị xóa.</p>
      <Link
        href="/admin/bids"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#0f2d5e] border border-[#0f2d5e]/20 px-4 py-2 rounded-lg hover:bg-[#0f2d5e] hover:text-white transition-colors"
      >
        <IconArrowLeft />
        Quay lại danh sách
      </Link>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminBidDetailPage({ bidId }: { bidId: string }) {
  const router = useRouter();
  const [bid, setBid] = useState<SupplierBid | null | undefined>(undefined);
  const [supplierAccount, setSupplierAccount] = useState<SupplierAccount | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  // Clarification state
  const [clarifications, setClarifications] = useState<BidClarification[]>([]);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyNote, setClarifyNote] = useState("");
  const [clarifyLoading, setClarifyLoading] = useState(false);
  // Attachments
  const [bidUploads, setBidUploads] = useState<Upload[]>([]);

  useEffect(() => {
    async function loadData() {
      const [found, clarRes, uploadsRes] = await Promise.all([
        getBidById(bidId),
        fetch(`/api/bids/${encodeURIComponent(bidId)}/clarifications`).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/uploads?entityType=bid&entityId=${encodeURIComponent(bidId)}`).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      setBid(found ?? null);
      setClarifications(clarRes.data ?? []);
      setBidUploads(uploadsRes.data ?? []);
      if (found) {
        const accounts = await getAccounts();
        setSupplierAccount(accounts.find((a) => a.id === found.supplierId) ?? null);
      }
      setLoading(false);
    }
    loadData();
  }, [bidId]);

  async function handleDelete() {
    if (!bid) return;
    await deleteBid(bid.id);
    router.push("/admin/bids");
  }

  async function handleStatusUpdate(newStatus: BidStatus) {
    if (!bid) return;
    // "Cần làm rõ" được xử lý qua modal clarification, không direct update
    if (newStatus === "Cần làm rõ") {
      setClarifyOpen(true);
      return;
    }
    await updateBidStatus(bid.id, newStatus);
    setBid((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setSuccessMsg("Đã cập nhật trạng thái báo giá.");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  async function handleSubmitClarification() {
    if (!bid || !clarifyNote.trim()) return;
    setClarifyLoading(true);
    try {
      const res = await fetch(`/api/bids/${encodeURIComponent(bid.id)}/clarifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestNote: clarifyNote.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi khi gửi yêu cầu");
      setClarifications((prev) => [...prev, json.data]);
      setBid((prev) => (prev ? { ...prev, status: "Cần làm rõ" } : prev));
      setClarifyOpen(false);
      setClarifyNote("");
      setSuccessMsg("Đã gửi yêu cầu làm rõ đến nhà cung cấp.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setClarifyLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><p className="text-slate-400 text-sm">Đang tải...</p></div>;
  }
  if (!bid) return <NotFound />;

  const statusCls = BID_STATUS_COLORS[bid.status] ?? "bg-slate-100 text-slate-500 border-slate-200";
  const actions = getActions(bid.status);
  const total = bidTotal(bid);
  const date = bidDate(bid);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/admin/bids" className="hover:text-slate-600 transition-colors">Báo giá</Link>
            <span>›</span>
            <span className="text-slate-600 font-mono">{bid.bidCode ?? bid.id}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Chi tiết báo giá</h1>
          <p className="text-sm text-slate-500 mt-1">{bidTitle(bid)}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${statusCls}`}>
            {bid.status}
          </span>
        </div>
      </div>

      {bid.status === "Đã phản hồi" && (
        <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3.5 mb-5">
          <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-teal-800">Nhà cung cấp đã cập nhật báo giá</p>
            <p className="text-xs text-teal-700 mt-0.5">Báo giá đã được bổ sung theo yêu cầu. Vui lòng xem lại và chuyển sang đánh giá hoặc yêu cầu bổ sung thêm.</p>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-sm">
          <IconCheck />
          {successMsg}
        </div>
      )}

      {/* ── Clarification Modal ────────────────────────────────────────────── */}
      {clarifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Yêu cầu làm rõ báo giá</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mô tả cụ thể thông tin cần nhà cung cấp làm rõ. Nội dung này sẽ được gửi đến nhà cung cấp.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              rows={5}
              placeholder="Vd: Cần bổ sung catalogue kỹ thuật cho mặt hàng X. Đơn giá mặt hàng Y cao hơn thị trường, đề nghị giải thích..."
              value={clarifyNote}
              onChange={(e) => setClarifyNote(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmitClarification}
                disabled={!clarifyNote.trim() || clarifyLoading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {clarifyLoading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
              <button
                onClick={() => { setClarifyOpen(false); setClarifyNote(""); }}
                className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clarification Timeline ─────────────────────────────────────────── */}
      {clarifications.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 mb-5">
          <h3 className="text-sm font-semibold text-orange-800 mb-3">Lịch sử yêu cầu làm rõ ({clarifications.length})</h3>
          <div className="space-y-4">
            {clarifications.map((c) => (
              <div key={c.id} className="space-y-2">
                {/* Request */}
                <div className="flex gap-3">
                  <div className="w-1.5 rounded-full bg-orange-400 shrink-0 mt-1" style={{ minHeight: 40 }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-700">Yêu cầu từ {c.requestedByName}</span>
                      <span className="text-xs text-slate-400">{new Date(c.requestedAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="text-sm text-slate-700 bg-white border border-orange-100 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">
                      {c.requestNote}
                    </p>
                  </div>
                </div>
                {/* Response */}
                {c.status === "responded" && c.responseNote && (
                  <div className="flex gap-3 pl-4">
                    <div className="w-1.5 rounded-full bg-teal-400 shrink-0 mt-1" style={{ minHeight: 40 }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-teal-700">Phản hồi từ {c.respondedByName}</span>
                        {c.respondedAt && <span className="text-xs text-slate-400">{new Date(c.respondedAt).toLocaleString("vi-VN")}</span>}
                      </div>
                      <p className="text-sm text-slate-700 bg-white border border-teal-100 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">
                        {c.responseNote}
                      </p>
                    </div>
                  </div>
                )}
                {c.status === "pending" && (
                  <div className="pl-4 ml-2">
                    <span className="text-xs text-orange-600 italic">Chờ nhà cung cấp phản hồi...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Thông tin gói thầu */}
          <Section title="Thông tin gói thầu">
            <InfoRow label="Mã gói thầu" value={<span className="font-mono font-semibold text-[#0f2d5e]">{bid.tenderCode}</span>} />
            <InfoRow label="Tên gói thầu" value={bidTitle(bid)} />
          </Section>

          {/* Nhà cung cấp */}
          <Section title="Nhà cung cấp">
            <InfoRow label="Tên công ty" value={<span className="font-semibold">{bid.supplierName || supplierAccount?.companyName || "—"}</span>} />
            <InfoRow label="Mã nhà cung cấp" value={<span className="font-mono">{bid.supplierId}</span>} />
            {supplierAccount && (
              <>
                <InfoRow label="Email" value={supplierAccount.email} />
                <InfoRow label="Người liên hệ" value={supplierAccount.contactName} />
                <InfoRow label="Điện thoại" value={supplierAccount.phone} />
                <InfoRow
                  label="Trạng thái NCC"
                  value={
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      supplierAccount.status === "Đã duyệt" ? "bg-green-100 text-green-700"
                      : supplierAccount.status === "Từ chối" ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                      {supplierAccount.status}
                    </span>
                  }
                />
              </>
            )}
          </Section>

          {/* Điều kiện thương mại */}
          <Section title="Điều kiện thương mại">
            <InfoRow
              label="Tổng giá trị báo giá"
              value={<span className="font-bold text-lg text-[#0f2d5e]">{formatVnd(total)}</span>}
            />
            <InfoRow label="Thời gian giao hàng" value={bid.deliveryTime} />
            <InfoRow label="Điều kiện thanh toán" value={bid.paymentTerms} />
            <InfoRow label="Bảo hành" value={bid.warrantyPolicy} />
            {bid.note && (
              <InfoRow label="Ghi chú" value={<p className="whitespace-pre-wrap leading-relaxed">{bid.note}</p>} />
            )}
            {/* backward compat: show technical note from old model */}
            {bid.technicalNote && !bid.note && (
              <InfoRow label="Ghi chú kỹ thuật" value={<p className="whitespace-pre-wrap leading-relaxed">{bid.technicalNote}</p>} />
            )}
          </Section>

          {/* Chi tiết mặt hàng */}
          <Section title={`Chi tiết mặt hàng${bid.items?.length ? ` (${bid.items.length} dòng)` : ""}`}>
            <BidItemsTable items={bid.items} />
          </Section>

          {/* Tài liệu đính kèm từ nhà cung cấp */}
          <Section title={`Tài liệu đính kèm${bidUploads.length ? ` (${bidUploads.length})` : ""}`}>
            <FileList
              uploads={bidUploads}
              canDelete={false}
              emptyText="Nhà cung cấp chưa đính kèm tài liệu nào."
            />
          </Section>

        </div>

        <div className="flex flex-col gap-5">

          {/* Timeline */}
          <Section title="Timeline">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Đã nộp báo giá</p>
                  <p className="text-xs text-slate-400 mt-0.5">{date ? formatDate(date) : "—"}</p>
                </div>
              </div>
              {bid.status !== "Đã nộp" && (
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${BID_STATUS_COLORS[bid.status] ?? "bg-slate-100"}`}>
                    <IconCheck />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Trạng thái hiện tại</p>
                    <p className="text-xs font-medium mt-0.5 text-slate-600">{bid.status}</p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Thao tác</h3>
            {actions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${action.style}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Không có thao tác nào khả dụng.</p>
            )}
            {bid.status === "Đang xem xét" && bid.tenderId && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-700 font-medium mb-1">Chọn NCC trúng thầu</p>
                <p className="text-xs text-indigo-600 mb-2">Việc chốt nhà cung cấp được thực hiện tại trang So sánh báo giá.</p>
                <Link
                  href={`/admin/tenders/${bid.tenderId}/comparison`}
                  className="block text-center text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 py-1.5 rounded-lg transition-colors"
                >
                  Đến So sánh báo giá →
                </Link>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/admin/bids"
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <IconArrowLeft />
                Quay lại danh sách
              </Link>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-500 border border-red-200 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Xóa báo giá
                </button>
              ) : (
                <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-semibold mb-1">Xác nhận xóa báo giá này?</p>
                  <p className="text-xs text-red-600 mb-3">Thao tác không thể hoàn tác.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Xóa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bid summary card */}
          <div className="bg-[#0f2d5e] text-white rounded-xl p-5">
            <h3 className="text-[#c9a227] font-semibold text-sm mb-3">Tóm tắt báo giá</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Mã báo giá</span>
                <span className="font-mono text-xs">{bid.bidCode ?? bid.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Nhà cung cấp</span>
                <span className="font-medium text-right max-w-[120px] truncate">{bid.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Số dòng hàng</span>
                <span className="font-medium">{bid.items?.length ?? "—"}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Tổng giá trị</span>
                  <span className="font-bold text-[#c9a227]">{formatVnd(total)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
