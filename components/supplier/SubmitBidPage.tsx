"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccounts } from "@/services/supplierAccountStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getBidsBySupplier, saveBid, updateBid, generateBidCode, generateBidId } from "@/services/supplierBidStorage";
import { ensureTenderSeedData, getAdminTenderById, adminToPublicTender } from "@/services/tenderStorage";
import { isDateTodayOrFuture } from "@/services/dateUtils";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { AdminTender } from "@/types/adminTender";
import type { Tender } from "@/types/tender";
import type { SupplierBid, BidItem } from "@/types/supplierBid";
import type { Upload } from "@/types/upload";
import PublicHeader from "@/components/shared/PublicHeader";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { FileList } from "@/components/ui/FileList";

// ── icons ──────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
    </svg>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────
function inputCls(err?: boolean) {
  return [
    "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors",
    "focus:ring-2 focus:ring-[#0f2d5e]/20",
    err
      ? "border-red-400 bg-red-50 focus:border-red-400"
      : "border-slate-200 bg-white focus:border-[#0f2d5e]",
  ].join(" ");
}

function formatVnd(value: number): string {
  if (!value || isNaN(value)) return "—";
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " triệu ₫";
  return value.toLocaleString("vi-VN") + " ₫";
}

function parsePrice(s: string): number {
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ── form state ─────────────────────────────────────────────────────────────
interface ItemForm {
  unitPrice: string;
  brand: string;
  origin: string;
  note: string;
}

interface HeaderForm {
  deliveryTime: string;
  paymentTerms: string;
  warrantyPolicy: string;
  note: string;
}

// ── helpers ────────────────────────────────────────────────────────────────
function normalizeSupplierStatus(a: { profileCompleted: boolean; status: string }): string {
  if (!a.profileCompleted) return "Chưa hoàn thiện";
  if (!a.status || a.status.trim() === "") return "Chờ xét duyệt";
  return a.status;
}

// ── not logged in ──────────────────────────────────────────────────────────
function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-500">
            <IconAlert />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Bạn cần đăng nhập</h2>
          <p className="text-sm text-slate-500 mb-8">
            Đăng nhập vào tài khoản nhà cung cấp để nộp báo giá.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/supplier/register-account"
              className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Đăng ký nhà cung cấp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── not approved ──────────────────────────────────────────────────────────
function NotApproved({ status }: { status: string }) {
  const isNeedsUpdate = status === "Yêu cầu bổ sung";
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${isNeedsUpdate ? "bg-amber-100 text-amber-500" : "bg-blue-100 text-blue-500"}`}>
            <IconAlert />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa thể nộp báo giá</h2>
          <p className="text-sm text-slate-500 mb-2">
            {isNeedsUpdate
              ? "Hồ sơ của bạn cần được cập nhật theo yêu cầu bổ sung trước khi có thể nộp báo giá."
              : "Tài khoản chưa được phê duyệt. Vui lòng chờ xét duyệt từ bộ phận mua sắm Bia Hạ Long."}
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Trạng thái: <span className="font-semibold text-slate-600">{status}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/supplier/profile"
              className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              {isNeedsUpdate ? "Cập nhật hồ sơ" : "Xem hồ sơ"}
            </Link>
            <Link
              href="/supplier"
              className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── already submitted ──────────────────────────────────────────────────────
function AlreadySubmitted({ tender }: { tender: Tender }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 text-blue-500">
            <IconCheck />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Bạn đã nộp báo giá</h2>
          <p className="text-sm text-slate-500 mb-6">
            Bạn đã nộp báo giá cho gói thầu <span className="font-semibold text-slate-700">{tender.code}</span> trước đó.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/supplier/bids"
              className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Xem báo giá đã nộp
            </Link>
            <Link
              href={`/tenders/${tender.id}`}
              className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Xem gói thầu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── success state ──────────────────────────────────────────────────────────
function SuccessState({
  tender,
  bidCode,
  bidId,
}: {
  tender: Tender;
  bidCode: string;
  bidId: string;
}) {
  const [attachments, setAttachments] = useState<Upload[]>([]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 py-10 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 text-green-600">
            <IconCheck />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Báo giá đã nộp thành công!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Bộ phận mua sắm sẽ xem xét và phản hồi trong thời gian sớm nhất.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Mã báo giá</span>
              <span className="font-mono font-semibold text-[#0f2d5e]">{bidCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Gói thầu</span>
              <span className="font-medium text-slate-700">{tender.code}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Trạng thái</span>
              <span className="text-green-600 font-semibold">Đã nộp</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/supplier/bids"
              className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Xem báo giá đã nộp
            </Link>
            <Link
              href={`/tenders/${tender.id}`}
              className="flex-1 border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors"
            >
              Xem gói thầu
            </Link>
          </div>
        </div>

        {/* Bid attachments — optional, after submit */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-lg w-full">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">
            Tài liệu đính kèm <span className="text-slate-400 font-normal">(không bắt buộc)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Tải lên catalog, chứng chỉ kỹ thuật hoặc tài liệu bổ sung cho báo giá này.
          </p>
          <FileUploadZone
            entityType="bid"
            entityId={bidId}
            purpose="bid_attachment"
            label="Thêm tài liệu đính kèm"
            onUploaded={(u) => setAttachments((prev) => [u, ...prev])}
          />
          <div className="mt-3">
            <FileList
              uploads={attachments}
              canDelete
              onDeleted={(id) => setAttachments((prev) => prev.filter((u) => u.id !== id))}
              emptyText=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function SubmitBidPage() {
  const searchParams = useSearchParams();
  const tenderId = searchParams.get("tenderId") ?? "";
  const editBidId = searchParams.get("edit") ?? "";
  const isEditMode = editBidId.length > 0;
  const { user: session, loading: sessionLoading } = useCurrentUser();

  const [account, setAccount] = useState<SupplierAccount | null>(null);
  const [adminTender, setAdminTender] = useState<AdminTender | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [editingBid, setEditingBid] = useState<SupplierBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [savedBidCode, setSavedBidCode] = useState<string | null>(null);
  const [savedBidId, setSavedBidId] = useState<string | null>(null);

  const [header, setHeader] = useState<HeaderForm>({
    deliveryTime: "",
    paymentTerms: "",
    warrantyPolicy: "",
    note: "",
  });
  const [itemForms, setItemForms] = useState<ItemForm[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [headerErrors, setHeaderErrors] = useState<Partial<Record<keyof HeaderForm, string>>>({});
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (sessionLoading) return;
    async function loadData() {
      ensureTenderSeedData();
      if (session && session.kind === "supplier") {
        const accounts = await getAccounts();
        setAccount(accounts.find((a) => a.id === session.id) ?? null);
      } else {
        setAccount(null);
      }

      const found = await getAdminTenderById(tenderId);
      if (found) {
        setAdminTender(found);
        setTender(adminToPublicTender(found));

        if (isEditMode && session && session.kind === "supplier") {
          // Fetch bid by id and preload form nếu status là "Cần làm rõ"
          try {
            const res = await fetch(`/api/bids/${encodeURIComponent(editBidId)}`);
            if (res.ok) {
              const { data: bidData } = (await res.json()) as { data: SupplierBid | null };
              if (bidData && bidData.status === "Cần làm rõ" && bidData.supplierId === session.id) {
                setEditingBid(bidData);
                setHeader({
                  deliveryTime: bidData.deliveryTime ?? "",
                  paymentTerms: bidData.paymentTerms ?? "",
                  warrantyPolicy: bidData.warrantyPolicy ?? "",
                  note: bidData.note ?? "",
                });
                setItemForms(found.items.map((tItem) => {
                  const bi = (bidData.items ?? []).find((b) => b.tenderItemId === tItem.id);
                  return {
                    unitPrice: bi?.unitPrice ? String(bi.unitPrice) : "",
                    brand: bi?.brand ?? "",
                    origin: bi?.origin ?? "",
                    note: bi?.note ?? "",
                  };
                }));
              } else {
                // Bid không hợp lệ để edit → fallback về AlreadySubmitted
                setAlreadySubmitted(true);
                setItemForms(found.items.map(() => ({ unitPrice: "", brand: "", origin: "", note: "" })));
              }
            }
          } catch {
            setItemForms(found.items.map(() => ({ unitPrice: "", brand: "", origin: "", note: "" })));
          }
        } else {
          // Normal mode: check existing bid
          setItemForms(found.items.map(() => ({ unitPrice: "", brand: "", origin: "", note: "" })));
          if (session && session.kind === "supplier") {
            const existing = (await getBidsBySupplier(session.id)).find((b) => b.tenderId === found.id);
            if (existing) setAlreadySubmitted(true);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [tenderId, editBidId, isEditMode, session, sessionLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Đang tải...</p>
      </div>
    );
  }
  if (!account) return <NotLoggedIn />;
  if (!tender || !adminTender) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Không tìm thấy gói thầu.</p>
            <Link href="/tenders" className="text-[#0f2d5e] hover:underline text-sm font-medium">
              Xem danh sách gói thầu
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const supplierStatus = normalizeSupplierStatus(account);
  if (supplierStatus !== "Đã duyệt") return <NotApproved status={supplierStatus} />;

  // Chỉ chặn nếu không phải edit mode hợp lệ
  if (alreadySubmitted && !editingBid) return <AlreadySubmitted tender={tender} />;
  if (savedBidCode) return <SuccessState tender={tender} bidCode={savedBidCode} bidId={savedBidId ?? ""} />;

  const isDeadlineActive = isDateTodayOrFuture(adminTender.deadline);
  const isReceivingBids = adminTender.status === "Đang nhận báo giá" || adminTender.status === "Đã đóng";
  const canSubmitBid = isReceivingBids && isDeadlineActive;

  // Trong edit mode ("Cần làm rõ"), cho phép kể cả khi tender đã đóng/hết hạn
  if (!canSubmitBid && !editingBid) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center max-w-sm">
            <p className="text-slate-500 mb-2">
              {!isDeadlineActive
                ? "Gói thầu đã hết hạn nộp báo giá."
                : "Gói thầu này đã đóng, không còn nhận báo giá."}
            </p>
            <Link href={`/tenders/${tender.id}`} className="text-[#0f2d5e] hover:underline text-sm font-medium">
              Xem chi tiết gói thầu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── computed totals ──────────────────────────────────────────────────────
  const amounts = adminTender.items.map((item, i) => {
    const price = parsePrice(itemForms[i]?.unitPrice ?? "");
    return price * item.quantity;
  });
  const totalAmount = amounts.reduce((s, a) => s + a, 0);

  function setHeaderField<K extends keyof HeaderForm>(key: K, value: string) {
    setHeader((prev) => ({ ...prev, [key]: value }));
    setHeaderErrors((prev) => ({ ...prev, [key]: undefined }));
    setGlobalError("");
  }

  function setItemField(idx: number, key: keyof ItemForm, value: string) {
    setItemForms((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
    setItemErrors((prev) => ({ ...prev, [idx]: "" }));
    setGlobalError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tender || !adminTender || !account) return;
    if (normalizeSupplierStatus(account) !== "Đã duyệt") {
      setGlobalError("Tài khoản chưa được duyệt. Không thể nộp báo giá.");
      return;
    }

    // Chỉ check tender open/close khi submit mới (không phải edit "Cần làm rõ")
    if (!editingBid) {
      const freshTender = await getAdminTenderById(adminTender.id);
      const freshTenderOk = freshTender?.status === "Đang nhận báo giá" || freshTender?.status === "Đã đóng";
      if (!freshTender || !freshTenderOk || !isDateTodayOrFuture(freshTender.deadline)) {
        setGlobalError(
          freshTender && !isDateTodayOrFuture(freshTender.deadline)
            ? "Gói thầu đã hết hạn nộp báo giá."
            : "Gói thầu này đã đóng, không còn nhận báo giá.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    const hErrs: Partial<Record<keyof HeaderForm, string>> = {};
    if (!header.deliveryTime.trim()) hErrs.deliveryTime = "Vui lòng nhập thời gian giao hàng.";
    if (!header.paymentTerms.trim()) hErrs.paymentTerms = "Vui lòng nhập điều kiện thanh toán.";

    const iErrs: Record<number, string> = {};
    adminTender.items.forEach((_, i) => {
      const price = parsePrice(itemForms[i]?.unitPrice ?? "");
      if (!itemForms[i]?.unitPrice?.trim()) {
        iErrs[i] = "Chưa nhập đơn giá.";
      } else if (price <= 0) {
        iErrs[i] = "Đơn giá phải > 0.";
      }
    });

    if (Object.keys(hErrs).length > 0 || Object.keys(iErrs).length > 0) {
      setHeaderErrors(hErrs);
      setItemErrors(iErrs);
      setGlobalError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const bidItems: BidItem[] = adminTender.items.map((tItem, i) => {
      const f = itemForms[i];
      const unitPrice = parsePrice(f.unitPrice);
      return {
        id: `BITEM-${Date.now()}-${i}`,
        tenderItemId: tItem.id,
        itemName: tItem.itemName,
        specification: tItem.specification || undefined,
        quantity: tItem.quantity,
        unit: tItem.unit,
        unitPrice,
        amount: unitPrice * tItem.quantity,
        brand: f.brand.trim() || undefined,
        origin: f.origin.trim() || undefined,
        note: f.note.trim() || undefined,
      };
    });

    const total = bidItems.reduce((s, item) => s + item.amount, 0);

    if (editingBid) {
      // Edit mode: PUT bid hiện có với status "Đã phản hồi"
      const updated: SupplierBid = {
        ...editingBid,
        status: "Đã phản hồi",
        submittedAt: new Date().toISOString(),
        totalAmount: total,
        deliveryTime: header.deliveryTime.trim() || undefined,
        paymentTerms: header.paymentTerms.trim() || undefined,
        warrantyPolicy: header.warrantyPolicy.trim() || undefined,
        note: header.note.trim() || undefined,
        items: bidItems,
      };
      await updateBid(updated);
      setSavedBidCode(editingBid.bidCode);
    } else {
      // Submit mới
      const bidCode = await generateBidCode();
      const bid: SupplierBid = {
        id: generateBidId(),
        bidCode,
        tenderId: tender.id,
        tenderCode: tender.code,
        tenderTitle: tender.name,
        supplierId: account.id,
        supplierName: account.companyName,
        supplierEmail: account.email,
        status: "Đã nộp",
        submittedAt: new Date().toISOString(),
        totalAmount: total,
        deliveryTime: header.deliveryTime.trim() || undefined,
        paymentTerms: header.paymentTerms.trim() || undefined,
        warrantyPolicy: header.warrantyPolicy.trim() || undefined,
        note: header.note.trim() || undefined,
        items: bidItems,
      };
      await saveBid(bid);
      setSavedBidId(bid.id);
      setSavedBidCode(bidCode);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      {/* Page title */}
      <div className="bg-white border-b border-slate-100 py-5 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/tenders" className="hover:text-slate-600 transition-colors">Gói thầu</Link>
            <span>›</span>
            <Link href={`/tenders/${tender.id}`} className="hover:text-slate-600 transition-colors truncate max-w-[200px]">
              {tender.code}
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-medium">
              {isEditMode ? "Cập nhật báo giá" : "Nộp báo giá"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0f2d5e]">
            {isEditMode ? "Cập nhật báo giá" : "Nộp báo giá"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{tender.name}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-7">

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Banner cảnh báo khi edit "Cần làm rõ" */}
            {isEditMode && editingBid && (
              <div className="flex gap-3 items-start bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 text-sm">
                <IconAlert />
                <div>
                  <p className="font-semibold mb-0.5">Báo giá cần bổ sung thông tin</p>
                  <p className="text-xs text-orange-700">
                    Phòng mua sắm yêu cầu bổ sung thông tin trước khi phê duyệt. Vui lòng cập nhật và gửi lại báo giá.
                  </p>
                </div>
              </div>
            )}

            {globalError && (
              <div className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                <IconAlert />
                <span>{globalError}</span>
              </div>
            )}

            {/* Điều kiện thương mại header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
                Điều kiện thương mại
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Thời gian giao hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={header.deliveryTime}
                    onChange={(e) => setHeaderField("deliveryTime", e.target.value)}
                    placeholder="VD: 15 ngày sau khi ký hợp đồng"
                    className={inputCls(!!headerErrors.deliveryTime)}
                  />
                  {headerErrors.deliveryTime && (
                    <p className="text-xs text-red-500 mt-1">{headerErrors.deliveryTime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Điều kiện thanh toán <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={header.paymentTerms}
                    onChange={(e) => setHeaderField("paymentTerms", e.target.value)}
                    placeholder="VD: 30% đặt cọc, 70% sau nghiệm thu"
                    className={inputCls(!!headerErrors.paymentTerms)}
                  />
                  {headerErrors.paymentTerms && (
                    <p className="text-xs text-red-500 mt-1">{headerErrors.paymentTerms}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bảo hành</label>
                  <input
                    type="text"
                    value={header.warrantyPolicy}
                    onChange={(e) => setHeaderField("warrantyPolicy", e.target.value)}
                    placeholder="VD: Bảo hành 12 tháng tại chỗ"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú chung</label>
                  <input
                    type="text"
                    value={header.note}
                    onChange={(e) => setHeaderField("note", e.target.value)}
                    placeholder="Thông tin bổ sung về báo giá"
                    className={inputCls()}
                  />
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Báo giá theo mặt hàng
                </h2>
                <span className="text-xs text-slate-400">{adminTender.items.length} mặt hàng</span>
              </div>

              {adminTender.items.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Gói thầu này chưa có danh sách mặt hàng.</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm" style={{ minWidth: 920 }}>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-8">STT</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 min-w-[120px]">Tên hàng</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[130px]">Quy cách</th>
                        <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-3 w-14">SL</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-14">ĐVT</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[130px]">
                          Đơn giá (₫) <span className="text-red-500">*</span>
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 py-2.5 pr-3 w-[120px]">Thành tiền</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[110px]">Thương hiệu</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 pr-3 w-[90px]">Xuất xứ</th>
                        <th className="text-left text-xs font-medium text-slate-400 py-2.5 w-[110px]">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminTender.items.map((item, i) => {
                        const f = itemForms[i] ?? { unitPrice: "", brand: "", origin: "", note: "" };
                        const price = parsePrice(f.unitPrice);
                        const amount = price * item.quantity;
                        const hasErr = !!itemErrors[i];
                        return (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-3 pr-3 text-xs text-slate-400 align-top pt-4">{i + 1}</td>
                            <td className="py-3 pr-3 align-top pt-3">
                              <p className="font-medium text-slate-800 text-xs leading-snug">{item.itemName}</p>
                            </td>
                            <td className="py-3 pr-3 align-top pt-3">
                              <p className="text-xs text-slate-500 leading-snug">{item.specification || "—"}</p>
                            </td>
                            <td className="py-3 pr-3 text-right font-semibold text-slate-700 align-top pt-3 text-xs whitespace-nowrap">
                              {item.quantity.toLocaleString("vi-VN")}
                            </td>
                            <td className="py-3 pr-3 text-xs text-slate-500 align-top pt-3 whitespace-nowrap">
                              {item.unit}
                            </td>
                            <td className="py-3 pr-3 align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={f.unitPrice}
                                onChange={(e) => setItemField(i, "unitPrice", e.target.value)}
                                placeholder="0"
                                className={[
                                  "w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none transition-colors",
                                  "focus:ring-2 focus:ring-[#0f2d5e]/20",
                                  hasErr
                                    ? "border-red-400 bg-red-50 focus:border-red-400"
                                    : "border-slate-200 bg-white focus:border-[#0f2d5e]",
                                ].join(" ")}
                              />
                              {hasErr && (
                                <p className="text-xs text-red-500 mt-1">{itemErrors[i]}</p>
                              )}
                            </td>
                            <td className="py-3 pr-3 text-right align-top pt-3">
                              <span className="text-xs font-semibold text-[#0f2d5e] whitespace-nowrap">
                                {amount > 0 ? formatVnd(amount) : "—"}
                              </span>
                            </td>
                            <td className="py-3 pr-3 align-top">
                              <input
                                type="text"
                                value={f.brand}
                                onChange={(e) => setItemField(i, "brand", e.target.value)}
                                placeholder="Nhãn hiệu"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/20 transition-colors"
                              />
                            </td>
                            <td className="py-3 pr-3 align-top">
                              <input
                                type="text"
                                value={f.origin}
                                onChange={(e) => setItemField(i, "origin", e.target.value)}
                                placeholder="Xuất xứ"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/20 transition-colors"
                              />
                            </td>
                            <td className="py-3 align-top">
                              <input
                                type="text"
                                value={f.note}
                                onChange={(e) => setItemField(i, "note", e.target.value)}
                                placeholder="Ghi chú"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#0f2d5e] focus:ring-2 focus:ring-[#0f2d5e]/20 transition-colors"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50/60">
                        <td colSpan={6} className="py-3 pr-3 text-xs font-semibold text-slate-600 text-right">
                          Tổng giá trị báo giá
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <span className="text-sm font-bold text-[#0f2d5e]">
                            {totalAmount > 0 ? formatVnd(totalAmount) : "—"}
                          </span>
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#c9a227] hover:bg-[#b8960c] text-[#0f2d5e] font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                {isEditMode ? "Gửi lại báo giá" : "Nộp báo giá"}
              </button>
              <Link
                href={`/tenders/${tender.id}`}
                className="flex-1 text-center border border-[#0f2d5e]/30 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 font-semibold py-3.5 rounded-xl text-sm transition-colors"
              >
                Quay lại gói thầu
              </Link>
            </form>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4 text-sm">Thông tin gói thầu</h3>
              <div className="space-y-3">
                {[
                  { label: "Mã gói thầu", value: tender.code },
                  { label: "Nhóm hàng", value: tender.category },
                  { label: "Bên mời thầu", value: tender.inviter },
                  { label: "Hạn nộp hồ sơ", value: tender.deadline },
                  { label: "Giá trị dự kiến", value: tender.value },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              <Link
                href={`/tenders/${tender.id}`}
                className="mt-4 block text-center text-xs font-medium text-[#0f2d5e] border border-[#0f2d5e]/20 py-2 rounded-lg hover:bg-[#0f2d5e]/5 transition-colors"
              >
                Xem chi tiết gói thầu →
              </Link>
            </div>

            {totalAmount > 0 && (
              <div className="bg-[#0f2d5e]/5 border border-[#0f2d5e]/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Tổng giá trị báo giá</p>
                <p className="text-lg font-bold text-[#0f2d5e]">{formatVnd(totalAmount)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Tự tính từ {adminTender.items.length} mặt hàng</p>
              </div>
            )}

            {isEditMode && editingBid && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800">
                <p className="font-semibold mb-1">Đang cập nhật báo giá</p>
                <p className="font-mono text-orange-700">{editingBid.bidCode}</p>
                <p className="text-orange-600 mt-1">Trạng thái: Cần làm rõ</p>
              </div>
            )}

            <div className="bg-[#0f2d5e] text-white rounded-2xl p-5">
              <h3 className="font-semibold mb-3 text-[#c9a227] text-sm">Nhà cung cấp</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{account.companyName}</p>
                <p className="text-xs text-white/60">Mã: <span className="font-mono">{account.id}</span></p>
                <p className="text-xs text-white/60">{account.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
