"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteTender, getAdminTenderById, reopenTender, saveAdminTender, updateAdminTenderStatus, ensureTenderSeedData } from "@/services/tenderStorage";
import { getBids } from "@/services/supplierBidStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  ensureCategorySeedData,
  getMaterialItems,
  getPurchaseCategories,
} from "@/services/categoryStorage";
import { formatDisplayDate, getTodayDateString, isDateTodayOrFuture, toDateInputValue } from "@/services/dateUtils";
import QuickMaterialModal from "@/components/admin/QuickMaterialModal";
import { NumberInput } from "@/components/ui/NumberInput";
import type { AdminTender, AdminTenderCategory, AdminTenderStatus } from "@/types/adminTender";
import type { SupplierBid } from "@/types/supplierBid";
import type { MaterialItem, PurchaseCategory } from "@/types/category";

// ── helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "Nháp":           "bg-slate-100 text-slate-600 border-slate-200",
  "Đang nhận báo giá":        "bg-green-100 text-green-700 border-green-200",
  "Đã đóng":        "bg-slate-200 text-slate-600 border-slate-300",
  "Đang đánh giá":  "bg-blue-100 text-blue-700 border-blue-200",
  "Đã có kết quả":  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Đã hủy":         "bg-red-100 text-red-600 border-red-200",
};

const BID_STATUS_COLORS: Record<string, string> = {
  "Đã nộp":          "bg-slate-100 text-slate-600",
  "Đang xem xét":    "bg-blue-100 text-blue-700",
  "Được đề xuất":    "bg-green-100 text-green-700",
  "Được chọn":       "bg-indigo-100 text-indigo-700",
  "Không được chọn": "bg-red-100 text-red-500",
};

function formatCurrency(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " tỷ ₫";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + " triệu ₫";
  return n.toLocaleString("vi-VN") + " ₫";
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function normalizeMaterialCode(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 py-2.5 border-b border-slate-50 last:border-0">
      <dt className="w-48 shrink-0 text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 flex-1">{value ?? <span className="text-slate-300">—</span>}</dd>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

// ── status actions ────────────────────────────────────────────────────────

type ActionConfig = { key: AdminTenderStatus; label: string; style: string };

function getActions(current: AdminTenderStatus): ActionConfig[] {
  switch (current) {
    case "Nháp":
      return [
        { key: "Đang nhận báo giá", label: "Phát hành gói thầu", style: "bg-[#0f2d5e] text-white hover:bg-[#0d2550]" },
        { key: "Đã hủy",  label: "Hủy gói thầu",       style: "border border-red-300 text-red-600 hover:bg-red-50" },
      ];
    case "Đang nhận báo giá":
      return [
        { key: "Đã đóng", label: "Đóng thầu",   style: "bg-amber-500 text-white hover:bg-amber-600" },
        { key: "Đã hủy",  label: "Hủy gói thầu", style: "border border-red-300 text-red-600 hover:bg-red-50" },
      ];
    case "Đã đóng":
      return [
        { key: "Đang đánh giá", label: "Chuyển sang đang đánh giá", style: "border border-blue-300 text-blue-600 hover:bg-blue-50" },
        { key: "Đã hủy",        label: "Hủy gói thầu",              style: "border border-red-300 text-red-600 hover:bg-red-50" },
      ];
    case "Đang đánh giá":
      return [
        { key: "Đã hủy", label: "Hủy gói thầu", style: "border border-red-300 text-red-600 hover:bg-red-50" },
      ];
    default:
      return [];
  }
}

// ── edit form types ───────────────────────────────────────────────────────

interface EditItem {
  id: string;
  materialId?: string;
  materialCode?: string;
  itemName: string;
  specification: string;
  quantity: string;
  unit: string;
  note: string;
}

interface EditForm {
  title: string;
  category: AdminTenderCategory;
  description: string;
  deadline: string;
  estimatedValue: string;
  deliveryLocation: string;
  deliveryTime: string;
  paymentTerms: string;
  documentRequirements: string[];
  items: EditItem[];
}

function tenderToEditForm(t: AdminTender): EditForm {
  return {
    title: t.title,
    category: t.category,
    description: t.description,
    deadline: toDateInputValue(t.deadline),
    estimatedValue: t.estimatedValue > 0 ? String(t.estimatedValue) : "",
    deliveryLocation: t.deliveryLocation,
    deliveryTime: t.deliveryTime,
    paymentTerms: t.paymentTerms,
    documentRequirements: [...t.documentRequirements],
    items: t.items.map((item) => ({
      id: item.id,
      materialId: item.materialId,
      materialCode: item.materialCode,
      itemName: item.itemName,
      specification: item.specification,
      quantity: String(item.quantity),
      unit: item.unit,
      note: item.note,
    })),
  };
}

// ── main component ────────────────────────────────────────────────────────

export default function AdminTenderDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [tender, setTender] = useState<AdminTender | null | undefined>(undefined);
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const role = currentUser?.role ?? "Chỉ xem";
  const permissions = currentUser?.permissions ?? [];
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenDeadline, setReopenDeadline] = useState(getTodayDateString());
  const [reopenError, setReopenError] = useState("");
  const [purchaseCategories, setPurchaseCategories] = useState<PurchaseCategory[]>([]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [quickMaterialRow, setQuickMaterialRow] = useState<number | null>(null);
  const [quickMaterialError, setQuickMaterialError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    ensureTenderSeedData();
    ensureCategorySeedData();
    async function loadData() {
      const [found, categories, materials, allBids] = await Promise.all([
        getAdminTenderById(id),
        getPurchaseCategories(),
        getMaterialItems(),
        getBids(),
      ]);
      setTender(found ?? null);
      setPurchaseCategories(categories.filter((category) => category.status === "Hoạt động"));
      setMaterialItems(materials);

      const code = found?.code ?? "";
      setBids(allBids.filter((b) => b.tenderId === id || b.tenderCode === code));

    }
    loadData();
  }, [id]);

  async function handleStatus(newStatus: AdminTenderStatus) {
    if (!tender) return;
    const oldStatus = tender.status;
    await updateAdminTenderStatus(tender.id, newStatus);
    setTender({ ...tender, status: newStatus });
    setSuccessMsg("Đã cập nhật trạng thái gói thầu.");
    setTimeout(() => setSuccessMsg(""), 4000);
    void oldStatus;
  }

  async function handleDelete() {
    if (!tender) return;
    if (!window.confirm(`Xóa vĩnh viễn gói thầu "${tender.title}"? Hành động này không thể hoàn tác.`)) return;
    setIsDeleting(true);
    try {
      await deleteTender(tender.id);
      router.push("/admin/tenders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại. Vui lòng thử lại.");
      setIsDeleting(false);
    }
  }

  function openReopenForm() {
    setReopenDeadline(getTodayDateString());
    setReopenError("");
    setShowReopenForm(true);
  }

  async function handleReopenTender() {
    if (!tender || !permissions.includes("admin:full") || tender.status !== "Đã đóng") return;
    const normalizedDeadline = toDateInputValue(reopenDeadline);
    if (!normalizedDeadline) {
      setReopenError("Ngày không hợp lệ.");
      return;
    }
    if (!isDateTodayOrFuture(normalizedDeadline)) {
      setReopenError("Hạn nộp hồ sơ phải từ hôm nay trở đi.");
      return;
    }
    if (!window.confirm("Xác nhận mở thầu lại gói thầu với hạn nộp mới?")) return;
    const updated = await reopenTender(tender.id, normalizedDeadline);
    if (!updated) {
      setReopenError("Không thể mở thầu lại với hạn nộp này.");
      return;
    }
    setTender(updated);
    setShowReopenForm(false);
    setReopenError("");
    setSuccessMsg("Đã mở thầu lại gói thầu.");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  function startEdit() {
    if (!tender) return;
    setForm(tenderToEditForm(tender));
    setFormErrors({});
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(null);
    setFormErrors({});
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function setItemField(idx: number, key: keyof EditItem, value: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], [key]: value };
      return { ...prev, items };
    });
  }

  function setItemMaterialError(idx: number, message: string) {
    setFormErrors((prev) => ({ ...prev, [`item_material_${idx}`]: message }));
  }

  function clearItemMaterialError(idx: number) {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[`item_material_${idx}`];
      return next;
    });
  }

  function isMaterialUsedInOtherEditRow(materialCode: string, currentIdx: number, editForm = form): boolean {
    const normalized = normalizeMaterialCode(materialCode);
    if (!normalized || !editForm) return false;
    return editForm.items.some((item, idx) => idx !== currentIdx && normalizeMaterialCode(item.materialCode) === normalized);
  }

  function getSelectedPurchaseCategory(categoryValue: string): PurchaseCategory | undefined {
    return purchaseCategories.find(
      (item) => item.name === categoryValue || item.code === categoryValue,
    );
  }

  function getMaterialSuggestions(categoryValue: string): MaterialItem[] {
    const category = getSelectedPurchaseCategory(categoryValue);
    return materialItems.filter((item) => {
      if (item.status !== "Hoạt động") return false;
      if (category) return item.categoryId === category.id;
      return item.categoryName === categoryValue;
    });
  }

  function applyMaterialToItem(idx: number, rawValue: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const suggestions = getMaterialSuggestions(prev.category);
      const selected = suggestions.find(
        (item) =>
          item.materialCode === rawValue ||
          `${item.materialCode} — ${item.materialName}` === rawValue,
      );
      const rawCode = selected?.materialCode ?? rawValue.trim();
      if (rawCode && isMaterialUsedInOtherEditRow(rawCode, idx, prev)) {
        setItemMaterialError(idx, "Mã vật tư này đã được chọn ở dòng khác.");
        return prev;
      }
      clearItemMaterialError(idx);
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        if (!selected) {
          return {
            ...item,
            materialId: undefined,
            materialCode: rawValue.trim() || undefined,
          };
        }
        return {
          ...item,
          materialId: selected.id,
          materialCode: selected.materialCode,
          itemName: selected.materialName,
          specification: selected.specification ?? "",
          unit: selected.unit,
        };
      });
      return { ...prev, items };
    });
  }

  function openQuickMaterial(idx: number) {
    if (!form || !getSelectedPurchaseCategory(form.category)) {
      setQuickMaterialError("Vui lòng chọn nhóm mua sắm trước khi thêm mã vật tư.");
      return;
    }
    setQuickMaterialError("");
    setQuickMaterialRow(idx);
  }

  async function handleQuickMaterialCreated(material: MaterialItem) {
    setMaterialItems(await getMaterialItems());
    setForm((prev) => {
      if (!prev || quickMaterialRow === null) return prev;
      const items = prev.items.map((item, i) =>
        i === quickMaterialRow
          ? {
              ...item,
              materialId: material.id,
              materialCode: material.materialCode,
              itemName: material.materialName,
              specification: material.specification ?? "",
              unit: material.unit,
            }
          : item,
      );
      return { ...prev, items };
    });
    setQuickMaterialRow(null);
    setQuickMaterialError("");
  }

  function addItem() {
    setForm((prev) =>
      prev
        ? { ...prev, items: [...prev.items, { id: `item-${Date.now()}`, materialId: undefined, materialCode: undefined, itemName: "", specification: "", quantity: "1", unit: "", note: "" }] }
        : prev
    );
  }

  function removeItem(idx: number) {
    setForm((prev) => (prev ? { ...prev, items: prev.items.filter((_, i) => i !== idx) } : prev));
  }

  function addDocReq() {
    setForm((prev) => (prev ? { ...prev, documentRequirements: [...prev.documentRequirements, ""] } : prev));
  }

  function setDocReq(idx: number, val: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const reqs = [...prev.documentRequirements];
      reqs[idx] = val;
      return { ...prev, documentRequirements: reqs };
    });
  }

  function removeDocReq(idx: number) {
    setForm((prev) =>
      prev ? { ...prev, documentRequirements: prev.documentRequirements.filter((_, i) => i !== idx) } : prev
    );
  }

  async function handleSave() {
    if (!form || !tender) return;
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Tên gói thầu không được rỗng.";
    if (!form.category.trim()) errors.category = "Vui lòng chọn nhóm hàng.";
    const normalizedDeadline = toDateInputValue(form.deadline);
    if (!form.deadline.trim()) errors.deadline = "Vui lòng chọn hạn nộp hồ sơ.";
    else if (!normalizedDeadline) errors.deadline = "Ngày không hợp lệ.";
    else if (!isDateTodayOrFuture(normalizedDeadline)) errors.deadline = "Hạn nộp hồ sơ phải từ hôm nay trở đi.";
    const estVal = form.estimatedValue.trim() ? parseFloat(form.estimatedValue.replace(/,/g, "")) : 0;
    if (form.estimatedValue.trim() && (isNaN(estVal) || estVal < 0))
      errors.estimatedValue = "Giá trị phải >= 0.";
    if (form.items.length === 0) errors.items = "Cần ít nhất 1 dòng vật tư.";
    form.items.forEach((item, i) => {
      if (!item.itemName.trim()) errors[`item_${i}`] = "Tên hàng không được rỗng.";
    });
    const usedMaterialCodes = new Map<string, number>();
    form.items.forEach((item, i) => {
      const code = normalizeMaterialCode(item.materialCode);
      if (!code) return;
      const firstIdx = usedMaterialCodes.get(code);
      if (firstIdx !== undefined) {
        errors[`item_material_${i}`] = "Mã vật tư này đã được chọn ở dòng khác.";
        errors[`item_material_${firstIdx}`] = errors[`item_material_${firstIdx}`] || "Mã vật tư này đã được chọn ở dòng khác.";
      } else {
        usedMaterialCodes.set(code, i);
      }
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updated: AdminTender = {
      ...tender,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      deadline: normalizedDeadline,
      estimatedValue: estVal,
      deliveryLocation: form.deliveryLocation.trim(),
      deliveryTime: form.deliveryTime.trim(),
      paymentTerms: form.paymentTerms.trim(),
      documentRequirements: form.documentRequirements.filter((r) => r.trim()),
      items: form.items.map((item) => ({
        id: item.id,
        materialId: item.materialId || undefined,
        materialCode: item.materialCode?.trim() || undefined,
        itemName: item.itemName.trim(),
        specification: item.specification.trim(),
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit.trim(),
        note: item.note.trim(),
      })),
      updatedAt: new Date().toISOString(),
    };

    await saveAdminTender(updated);
    setTender(updated);
    setIsEditing(false);
    setForm(null);
    setFormErrors({});
    setSuccessMsg("Đã cập nhật thông tin gói thầu.");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  if (tender === undefined) {
    return <div className="py-20 text-center text-sm text-slate-400">Đang tải...</div>;
  }

  if (tender === null) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-slate-600 font-medium mb-1">Không tìm thấy gói thầu</p>
        <p className="text-sm text-slate-400 mb-6">ID: {id}</p>
        <Link href="/admin/tenders" className="text-sm text-[#0f2d5e] font-medium hover:text-[#c9a227] transition-colors">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const actions = getActions(tender.status);
  const isFinalized = tender.status === "Đã có kết quả";
  const canEdit = permissions.includes("tenders:write") && !isFinalized;
  const canStatus = permissions.includes("tenders:publish") && !isFinalized;
  const canDelete = permissions.includes("tenders:delete");
  const isAdmin = permissions.includes("admin:full");
  const canReopenTender = isAdmin && tender.status === "Đã đóng";
  const categoryOptions =
    form && form.category && !purchaseCategories.some((category) => category.name === form.category || category.code === form.category)
      ? [
          { id: "current-category", code: "", name: form.category, status: "Hoạt động", createdAt: tender.createdAt } as PurchaseCategory,
          ...purchaseCategories,
        ]
      : purchaseCategories;
  const editMaterialSuggestions = form ? getMaterialSuggestions(form.category) : [];
  const selectedEditCategory = form ? getSelectedPurchaseCategory(form.category) : undefined;
  const getEditMaterialSuggestionsForRow = (idx: number) =>
    editMaterialSuggestions.filter(
      (material) => !isMaterialUsedInOtherEditRow(material.materialCode, idx),
    );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/tenders" className="hover:text-[#0f2d5e] transition-colors">Gói thầu</Link>
        <span>/</span>
        <span className="font-mono text-slate-600">{tender.code}</span>
        {isEditing && <span className="text-amber-600 font-medium">· Đang chỉnh sửa</span>}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-slate-400">{tender.code}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[tender.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {tender.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{tender.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tender.category} · Hạn nộp: {formatDisplayDate(tender.deadline)}</p>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-400">
          <div>Tạo: {formatDate(tender.createdAt)}</div>
          {tender.estimatedValue > 0 && (
            <div className="mt-1 text-sm font-semibold text-[#0f2d5e]">{formatCurrency(tender.estimatedValue)}</div>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: info / edit form */}
        <div className="lg:col-span-2 space-y-5">
          {isEditing && form ? (
            <>
              {/* Edit: General info */}
              <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Thông tin chung</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className={labelCls}>Tên gói thầu <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} />
                    {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nhóm hàng</label>
                      <select className={inputCls} value={form.category} onChange={(e) => setField("category", e.target.value as AdminTenderCategory)}>
                        {categoryOptions.length === 0 && <option value="">Chưa có nhóm đang hoạt động</option>}
                        {categoryOptions.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                      </select>
                      {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Hạn nộp hồ sơ <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="date" min={getTodayDateString()} value={form.deadline} onChange={(e) => setField("deadline", e.target.value)} />
                      {formErrors.deadline && <p className="text-xs text-red-500 mt-1">{formErrors.deadline}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Giá trị dự kiến (₫)</label>
                    <NumberInput className={inputCls} value={form.estimatedValue} onChange={(v) => setField("estimatedValue", v)} placeholder="0" />
                    {formErrors.estimatedValue && <p className="text-xs text-red-500 mt-1">{formErrors.estimatedValue}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Mô tả</label>
                    <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} />
                  </div>
                </div>
              </section>

              {/* Edit: Commercial terms */}
              <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Điều kiện thương mại</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className={labelCls}>Địa điểm giao hàng</label>
                    <input className={inputCls} value={form.deliveryLocation} onChange={(e) => setField("deliveryLocation", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Thời gian giao hàng dự kiến</label>
                    <input className={inputCls} value={form.deliveryTime} onChange={(e) => setField("deliveryTime", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Điều kiện thanh toán</label>
                    <input className={inputCls} value={form.paymentTerms} onChange={(e) => setField("paymentTerms", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Yêu cầu hồ sơ báo giá</label>
                    <div className="space-y-2">
                      {form.documentRequirements.map((req, i) => (
                        <div key={i} className="flex gap-2">
                          <input className={inputCls} value={req} onChange={(e) => setDocReq(i, e.target.value)} placeholder={`Yêu cầu ${i + 1}`} />
                          <button type="button" onClick={() => removeDocReq(i)} className="px-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addDocReq} className="text-xs text-[#0f2d5e] hover:text-[#c9a227] font-medium transition-colors">
                        + Thêm yêu cầu
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Edit: Items */}
              <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    Danh sách vật tư
                    <span className="ml-2 text-xs font-normal text-slate-400">({form.items.length} dòng)</span>
                  </h3>
                  <button type="button" onClick={addItem} className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors">
                    + Thêm dòng
                  </button>
                </div>
                {formErrors.items && <p className="px-5 pt-3 text-xs text-red-500">{formErrors.items}</p>}
                {quickMaterialError && (
                  <div className="px-5 pt-3 text-xs text-amber-700">
                    {quickMaterialError}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">#</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 min-w-[140px]">Mã vật tư</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 min-w-[140px]">Tên hàng *</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 min-w-[120px]">Quy cách</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 w-20">Số lượng</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 w-20">Đơn vị</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 min-w-[100px]">Ghi chú</th>
                        <th className="px-3 py-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {form.items.map((item, i) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs text-slate-400 align-top pt-3">{i + 1}</td>
                          <td className="px-3 py-2 align-top">
                            <div className="min-w-[140px]">
                              <datalist id={`material-options-edit-${i}`}>
                                {getEditMaterialSuggestionsForRow(i).map((material) => (
                                  <option
                                    key={material.id}
                                    value={`${material.materialCode} — ${material.materialName}`}
                                  />
                                ))}
                              </datalist>
                              <input
                                className={`${inputCls} ${formErrors[`item_material_${i}`] ? "border-red-300" : ""}`}
                                list={`material-options-edit-${i}`}
                                value={item.materialCode ?? ""}
                                onChange={(e) => applyMaterialToItem(i, e.target.value)}
                                placeholder="Chọn mã"
                              />
                              {formErrors[`item_material_${i}`] && (
                                <p className="text-[11px] text-red-500 mt-1">{formErrors[`item_material_${i}`]}</p>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openQuickMaterial(i)}
                                  className="mt-2 block text-[11px] font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                                >
                                  + Tạo nhanh mã vật tư
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              className={`${inputCls} ${formErrors[`item_${i}`] ? "border-red-300" : ""}`}
                              value={item.itemName}
                              onChange={(e) => setItemField(i, "itemName", e.target.value)}
                              placeholder="Tên hàng"
                            />
                            {formErrors[`item_${i}`] && <p className="text-xs text-red-500 mt-0.5">{formErrors[`item_${i}`]}</p>}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input className={inputCls} value={item.specification} onChange={(e) => setItemField(i, "specification", e.target.value)} placeholder="Quy cách" />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <NumberInput className={inputCls} value={item.quantity} onChange={(v) => setItemField(i, "quantity", v)} placeholder="0" />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input className={inputCls} value={item.unit} onChange={(e) => setItemField(i, "unit", e.target.value)} placeholder="Cái, kg..." />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input className={inputCls} value={item.note} onChange={(e) => setItemField(i, "note", e.target.value)} placeholder="Ghi chú" />
                          </td>
                          <td className="px-3 py-2 text-center align-top pt-3">
                            <button type="button" onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {form.items.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-center text-sm text-slate-400">
                            Chưa có vật tư. Nhấn &quot;+ Thêm dòng&quot; để thêm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* View: General info */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Thông tin chung</h3>
                </div>
                <dl className="px-5 py-1">
                  <InfoRow label="Mã gói thầu" value={tender.code} />
                  <InfoRow label="Tên gói thầu" value={tender.title} />
                  <InfoRow label="Nhóm hàng" value={tender.category} />
                  <InfoRow label="Trạng thái" value={tender.status} />
                  <InfoRow label="Hạn nộp hồ sơ" value={formatDisplayDate(tender.deadline)} />
                  <InfoRow label="Giá trị dự kiến" value={tender.estimatedValue > 0 ? formatCurrency(tender.estimatedValue) : undefined} />
                  <InfoRow label="Mô tả" value={tender.description} />
                </dl>
              </section>

              {/* View: Commercial terms */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-700 text-sm">Điều kiện thương mại</h3>
                </div>
                <dl className="px-5 py-1">
                  <InfoRow label="Địa điểm giao hàng" value={tender.deliveryLocation} />
                  <InfoRow label="Thời gian giao hàng" value={tender.deliveryTime} />
                  <InfoRow label="Điều kiện thanh toán" value={tender.paymentTerms} />
                </dl>
                {tender.documentRequirements.length > 0 && (
                  <div className="px-5 pb-4">
                    <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Yêu cầu hồ sơ báo giá</dt>
                    <ul className="space-y-1">
                      {tender.documentRequirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-[#0f2d5e] mt-0.5">·</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* View: Items */}
              {tender.items.length > 0 && (
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-700 text-sm">
                      Danh sách vật tư
                      <span className="ml-2 text-xs font-normal text-slate-400">({tender.items.length} dòng)</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">#</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">Tên hàng</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 hidden md:table-cell">Quy cách</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Số lượng</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">Đơn vị</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 hidden lg:table-cell">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tender.items.map((item, i) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-slate-400">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              {item.materialCode && <div className="font-mono text-[11px] text-slate-400 mb-0.5">{item.materialCode}</div>}
                              <div className="font-medium text-slate-800">{item.itemName}</div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 hidden md:table-cell text-xs">{item.specification}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-slate-600">{item.unit}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs hidden lg:table-cell">{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Bids section — always visible */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 text-sm">
                Báo giá đã nộp
                {bids.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({bids.length})</span>}
              </h3>
            </div>
            {bids.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-400 text-center">
                Chưa có báo giá nào được nộp cho gói thầu này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Nhà cung cấp</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Giá trị</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 hidden sm:table-cell">Ngày nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bids.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 text-sm">{b.supplierName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700 text-sm whitespace-nowrap">
                          {formatCurrency(b.totalAmount ?? b.totalPrice ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BID_STATUS_COLORS[b.status] ?? "bg-slate-100 text-slate-500"}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">
                          {formatDate(b.submittedAt ?? b.createdAt ?? "")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <h3 className="font-semibold text-slate-700 text-sm mb-4">Lưu thay đổi</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-3">Chỉnh sửa</h3>
                <button
                  onClick={startEdit}
                  disabled={!canEdit}
                  title={isFinalized ? "Gói thầu đã chốt kết quả, không thể chỉnh sửa" : !canEdit ? "Bạn không có quyền chỉnh sửa gói thầu" : undefined}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-[#0f2d5e] text-[#0f2d5e] hover:bg-[#0f2d5e] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#0f2d5e]"
                >
                  Chỉnh sửa thông tin
                </button>
              </div>
              {actions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-700 text-sm mb-4">Cập nhật trạng thái</h3>
                  <div className="space-y-2">
                    {canReopenTender && (
                      <button
                        onClick={openReopenForm}
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                      >
                        Mở thầu lại
                      </button>
                    )}
                    {actions.map((action) => (
                      <button
                        key={action.key}
                        onClick={() => handleStatus(action.key)}
                        disabled={!canStatus}
                        title={!canStatus ? "Bạn không có quyền thay đổi trạng thái" : undefined}
                        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${action.style}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {canDelete && (
                <div className="bg-white rounded-xl border border-red-100 p-5">
                  <h3 className="font-semibold text-slate-700 text-sm mb-3">Xóa gói thầu</h3>
                  <button
                    onClick={handleDelete}
                    disabled={tender.status !== "Nháp" || isDeleting}
                    title={
                      tender.status !== "Nháp"
                        ? `Chỉ xóa được gói thầu ở trạng thái Nháp (hiện tại: ${tender.status})`
                        : "Xóa vĩnh viễn gói thầu này"
                    }
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                  </button>
                  {tender.status !== "Nháp" && (
                    <p className="text-xs text-slate-400 mt-2">Chỉ xóa được khi trạng thái là Nháp.</p>
                  )}
                </div>
              )}
              {(tender.status === "Đang đánh giá" || tender.status === "Chờ phê duyệt" || tender.status === "Đã có kết quả") && bids.length > 0 && (
                <Link
                  href={`/admin/tenders/${tender.id}/comparison`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  So sánh báo giá
                </Link>
              )}
              {tender.status === "Đã có kết quả" && (
                <div className="space-y-2">
                  <Link
                    href={`/admin/tenders/${tender.id}/report`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Xem báo cáo kết quả
                  </Link>
                  <a
                    href={`/api/export/tenders/${tender.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Xuất Excel
                  </a>
                </div>
              )}
              {tender.status === "Đang nhận báo giá" && bids.length > 0 && (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                    <p className="font-semibold mb-1">Đã có {bids.length} báo giá</p>
                    <p className="mb-2">Để so sánh và chọn NCC: <strong>Đóng thầu</strong> → Chuyển sang đánh giá → So sánh báo giá.</p>
                  </div>
                  <Link
                    href={`/admin/tenders/${tender.id}/comparison`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Xem trước so sánh báo giá
                  </Link>
                </div>
              )}
              {tender.status === "Đã đóng" && bids.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-0.5">Gói thầu đã đóng – {bids.length} báo giá</p>
                  <p>Nhấn &quot;Chuyển sang đang đánh giá&quot; rồi vào &quot;So sánh báo giá&quot; để chọn NCC trúng thầu.</p>
                </div>
              )}
            </>
          )}

          <Link
            href="/admin/tenders"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách
          </Link>

          {tender.status !== "Nháp" && tender.status !== "Đã hủy" && (
            <Link
              href={`/tenders/${tender.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Xem trang công khai
            </Link>
          )}
        </div>
      </div>

      {isAdmin && quickMaterialRow !== null && selectedEditCategory && (
        <QuickMaterialModal
          category={selectedEditCategory}
          materials={materialItems}
          onClose={() => setQuickMaterialRow(null)}
          onCreated={handleQuickMaterialCreated}
        />
      )}

      {showReopenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-800">Mở thầu lại</h3>
              <button
                type="button"
                onClick={() => setShowReopenForm(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng form mở thầu lại"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Hạn nộp mới <span className="text-red-500">*</span></label>
                <input
                  className={inputCls}
                  type="date"
                  min={getTodayDateString()}
                  value={reopenDeadline}
                  onChange={(e) => {
                    setReopenDeadline(e.target.value);
                    setReopenError("");
                  }}
                />
                {reopenError && <p className="text-xs text-red-500 mt-1">{reopenError}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowReopenForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleReopenTender}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                >
                  Mở thầu lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
