"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  saveAdminTender,
  generateTenderCode,
  generateTenderId,
} from "@/services/tenderStorage";
import {
  ensureCategorySeedData,
  getMaterialItems,
  getPurchaseCategories,
} from "@/services/categoryStorage";
import { getInternalSession } from "@/services/authStorage";
import { getTodayDateString, isDateTodayOrFuture, toDateInputValue } from "@/services/dateUtils";
import QuickMaterialModal from "@/components/admin/QuickMaterialModal";
import type {
  AdminTender,
  AdminTenderCategory,
  AdminTenderItem,
} from "@/types/adminTender";
import type { MaterialItem, PurchaseCategory } from "@/types/category";

// ── constants ─────────────────────────────────────────────────────────────

const UNITS = ["Cái", "Bộ", "Kg", "Tấn", "Mét", "M²", "M³", "Lít", "Thùng", "Cuộn", "Hộp", "Gói"];

// ── types ─────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  category: AdminTenderCategory;
  description: string;
  deadline: string;
  estimatedValue: string;
  deliveryLocation: string;
  deliveryTime: string;
  paymentTerms: string;
  documentRequirements: string; // textarea — newline-separated
}

function emptyItem(idx: number): AdminTenderItem {
  return {
    id: `item-${Date.now()}-${idx}`,
    itemName: "",
    specification: "",
    quantity: 1,
    unit: "Cái",
    note: "",
  };
}

function normalizeMaterialCode(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

// ── field helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string | number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e]"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] resize-none"
    />
  );
}

// ── section wrapper ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── success state ─────────────────────────────────────────────────────────

function SuccessState({ tender }: { tender: AdminTender }) {
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        {tender.status === "Nháp" ? "Đã lưu nháp!" : "Gói thầu đã phát hành!"}
      </h3>
      <p className="text-sm text-slate-500 mb-2">
        <span className="font-mono font-semibold text-slate-700">{tender.code}</span>
        {" – "}{tender.title}
      </p>
      <p className="text-xs text-slate-400 mb-8">
        Trạng thái:{" "}
        <span
          className={
            tender.status === "Nháp"
              ? "text-slate-600 font-medium"
              : "text-green-600 font-medium"
          }
        >
          {tender.status}
        </span>
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/admin/tenders"
          className="px-5 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Về danh sách gói thầu
        </Link>
        <Link
          href={`/admin/tenders/${tender.id}`}
          className="px-5 py-2.5 text-sm font-medium bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] transition-colors"
        >
          Xem chi tiết gói thầu →
        </Link>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────

export default function AdminTenderCreatePage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    category: "",
    description: "",
    deadline: "",
    estimatedValue: "",
    deliveryLocation: "Kho nguyên liệu – KCN Việt Hưng, TP. Hạ Long, Quảng Ninh",
    deliveryTime: "",
    paymentTerms: "Thanh toán 100% trong vòng 30 ngày sau khi giao hàng và nghiệm thu.",
    documentRequirements: "Báo giá theo mẫu đính kèm\nChứng chỉ chất lượng CO/CQ\nHồ sơ năng lực doanh nghiệp",
  });
  const [items, setItems] = useState<AdminTenderItem[]>([emptyItem(0)]);
  const [purchaseCategories, setPurchaseCategories] = useState<PurchaseCategory[]>([]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [saved, setSaved] = useState<AdminTender | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState("Chỉ xem");
  const [quickMaterialRow, setQuickMaterialRow] = useState<number | null>(null);
  const [quickMaterialError, setQuickMaterialError] = useState("");

  useEffect(() => {
    ensureCategorySeedData();
    const activeCategories = getPurchaseCategories().filter((category) => category.status === "Hoạt động");
    setPurchaseCategories(activeCategories);
    setMaterialItems(getMaterialItems());
    setRole(getInternalSession()?.role || "Chỉ xem");
    setForm((prev) => {
      if (prev.category && activeCategories.some((category) => category.name === prev.category || category.code === prev.category)) {
        return prev;
      }
      return { ...prev, category: activeCategories[0]?.name ?? "" };
    });
  }, []);

  const selectedCategory = useMemo(
    () => purchaseCategories.find((item) => item.name === form.category || item.code === form.category),
    [form.category, purchaseCategories],
  );

  const materialSuggestions = useMemo(() => {
    if (!selectedCategory) return [];
    return materialItems.filter(
      (item) => item.status === "Hoạt động" && item.categoryId === selectedCategory.id,
    );
  }, [materialItems, selectedCategory]);

  function setField(key: keyof FormState, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function updateItem(idx: number, key: keyof AdminTenderItem, val: string | number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  }

  function setItemMaterialError(idx: number, message: string) {
    setErrors((prev) => ({ ...prev, [`item_material_${idx}`]: message }));
  }

  function clearItemMaterialError(idx: number) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`item_material_${idx}`];
      return next;
    });
  }

  function isMaterialUsedInOtherRow(materialCode: string, currentIdx: number): boolean {
    const normalized = normalizeMaterialCode(materialCode);
    if (!normalized) return false;
    return items.some((item, idx) => idx !== currentIdx && normalizeMaterialCode(item.materialCode) === normalized);
  }

  function getMaterialSuggestionsForRow(idx: number): MaterialItem[] {
    return materialSuggestions.filter(
      (material) => !isMaterialUsedInOtherRow(material.materialCode, idx),
    );
  }

  function applyMaterialToItem(idx: number, rawValue: string) {
    const selected = materialSuggestions.find(
      (item) =>
        item.materialCode === rawValue ||
        `${item.materialCode} — ${item.materialName}` === rawValue,
    );
    const rawCode = selected?.materialCode ?? rawValue.trim();

    if (rawCode && isMaterialUsedInOtherRow(rawCode, idx)) {
      setItemMaterialError(idx, "Mã vật tư này đã được chọn ở dòng khác.");
      return;
    }

    clearItemMaterialError(idx);

    setItems((prev) =>
      prev.map((item, i) => {
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
      }),
    );
  }

  function openQuickMaterial(idx: number) {
    if (!selectedCategory) {
      setQuickMaterialError("Vui lòng chọn nhóm mua sắm trước khi thêm mã vật tư.");
      return;
    }
    setQuickMaterialError("");
    setQuickMaterialRow(idx);
  }

  function handleQuickMaterialCreated(material: MaterialItem) {
    setMaterialItems(getMaterialItems());
    if (quickMaterialRow !== null) {
      setItems((prev) =>
        prev.map((item, i) =>
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
        ),
      );
    }
    setQuickMaterialRow(null);
    setQuickMaterialError("");
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length)]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Vui lòng nhập tên gói thầu.";
    if (!form.category.trim()) errs.category = "Vui lòng chọn nhóm hàng.";
    if (!form.deadline) errs.deadline = "Vui lòng chọn hạn nộp hồ sơ.";
    else if (!toDateInputValue(form.deadline)) errs.deadline = "Ngày không hợp lệ.";
    else if (!isDateTodayOrFuture(form.deadline)) errs.deadline = "Hạn nộp hồ sơ phải từ hôm nay trở đi.";
    const usedMaterialCodes = new Map<string, number>();
    items.forEach((item, idx) => {
      const code = normalizeMaterialCode(item.materialCode);
      if (!code) return;
      const firstIdx = usedMaterialCodes.get(code);
      if (firstIdx !== undefined) {
        errs[`item_material_${idx}`] = "Mã vật tư này đã được chọn ở dòng khác.";
        errs[`item_material_${firstIdx}`] = errs[`item_material_${firstIdx}`] || "Mã vật tư này đã được chọn ở dòng khác.";
      } else {
        usedMaterialCodes.set(code, idx);
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildTender(status: "Nháp" | "Đang mở"): AdminTender {
    return {
      id: generateTenderId(),
      code: generateTenderCode(),
      title: form.title.trim(),
      category: form.category,
      status,
      deadline: toDateInputValue(form.deadline),
      estimatedValue: parseFloat(form.estimatedValue.replace(/[^\d.]/g, "")) || 0,
      description: form.description.trim(),
      deliveryLocation: form.deliveryLocation.trim(),
      deliveryTime: form.deliveryTime.trim(),
      paymentTerms: form.paymentTerms.trim(),
      documentRequirements: form.documentRequirements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      items: items
        .filter((item) => item.itemName.trim())
        .map((item) => ({
          ...item,
          materialCode: item.materialCode?.trim() || undefined,
          materialId: item.materialId || undefined,
          itemName: item.itemName.trim(),
          specification: item.specification.trim(),
          unit: item.unit.trim(),
          note: item.note.trim(),
        })),
      createdAt: new Date().toISOString(),
    };
  }

  function handleSaveDraft() {
    if (!validate()) return;
    const tender = buildTender("Nháp");
    saveAdminTender(tender);
    setSaved(tender);
  }

  function handlePublish() {
    if (!validate()) return;
    const tender = buildTender("Đang mở");
    saveAdminTender(tender);
    setSaved(tender);
  }

  if (saved) return <SuccessState tender={saved} />;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/tenders" className="hover:text-[#0f2d5e] transition-colors">Gói thầu</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Tạo gói thầu mới</span>
      </div>

      {/* Basic info */}
      <Section title="Thông tin gói thầu">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Tên gói thầu *</Label>
            <Input
              value={form.title}
              onChange={(v) => setField("title", v)}
              placeholder="VD: Cung cấp thép cuộn cán nóng Q195/Q235"
              required
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label>Nhóm hàng</Label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white"
            >
              {purchaseCategories.length === 0 && <option value="">Chưa có nhóm đang hoạt động</option>}
              {purchaseCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
          <div>
            <Label>Hạn nộp hồ sơ báo giá *</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(v) => setField("deadline", v)}
              min={getTodayDateString()}
              required
            />
            {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
          </div>
          <div>
            <Label>Giá trị dự kiến (₫)</Label>
            <Input
              value={form.estimatedValue}
              onChange={(v) => setField("estimatedValue", v)}
              placeholder="VD: 2400000000"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Mô tả gói thầu</Label>
            <Textarea
              value={form.description}
              onChange={(v) => setField("description", v)}
              placeholder="Mô tả yêu cầu, tiêu chuẩn, số lượng dự kiến..."
              rows={4}
            />
          </div>
        </div>
      </Section>

      {/* Commercial terms */}
      <Section title="Điều kiện thương mại">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Địa điểm giao hàng</Label>
            <Input
              value={form.deliveryLocation}
              onChange={(v) => setField("deliveryLocation", v)}
              placeholder="VD: Kho nguyên liệu – KCN Việt Hưng, Hạ Long"
            />
          </div>
          <div>
            <Label>Thời gian giao hàng dự kiến</Label>
            <Input
              value={form.deliveryTime}
              onChange={(v) => setField("deliveryTime", v)}
              placeholder="VD: 10–15 ngày làm việc sau ký hợp đồng"
            />
          </div>
          <div>
            <Label>Điều kiện thanh toán</Label>
            <Input
              value={form.paymentTerms}
              onChange={(v) => setField("paymentTerms", v)}
              placeholder="VD: Thanh toán 100% trong 30 ngày"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Yêu cầu hồ sơ báo giá (mỗi yêu cầu trên một dòng)</Label>
            <Textarea
              value={form.documentRequirements}
              onChange={(v) => setField("documentRequirements", v)}
              placeholder="Báo giá theo mẫu&#10;Chứng chỉ chất lượng CO/CQ&#10;Hồ sơ năng lực..."
              rows={4}
            />
          </div>
        </div>
      </Section>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">
            Danh sách vật tư / hàng hóa
            <span className="ml-2 text-xs font-normal text-slate-400">({items.length} dòng)</span>
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm dòng
          </button>
        </div>
        {quickMaterialError && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
            {quickMaterialError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 w-6">#</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Mã vật tư</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Tên hàng *</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 hidden md:table-cell">Quy cách / thông số</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 w-24">Số lượng</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 w-28">Đơn vị</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 hidden lg:table-cell">Ghi chú</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2 text-xs text-slate-400 align-top pt-3">{idx + 1}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="min-w-[150px]">
                      <datalist id={`material-options-create-${idx}`}>
                        {getMaterialSuggestionsForRow(idx).map((material) => (
                          <option
                            key={material.id}
                            value={`${material.materialCode} — ${material.materialName}`}
                          />
                        ))}
                      </datalist>
                      <input
                        type="text"
                        list={`material-options-create-${idx}`}
                        value={item.materialCode ?? ""}
                        onChange={(e) => applyMaterialToItem(idx, e.target.value)}
                        placeholder="Chọn mã"
                        className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30 ${
                          errors[`item_material_${idx}`] ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {errors[`item_material_${idx}`] && (
                        <p className="text-[11px] text-red-500 mt-1">{errors[`item_material_${idx}`]}</p>
                      )}
                      {role === "Admin" && (
                        <button
                          type="button"
                          onClick={() => openQuickMaterial(idx)}
                          className="mt-2 block text-[11px] font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                        >
                          + Tạo nhanh mã vật tư
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                      placeholder="Tên hàng hóa"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30 min-w-[140px]"
                    />
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell align-top">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => updateItem(idx, "specification", e.target.value)}
                      placeholder="Quy cách, tiêu chuẩn..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30 min-w-[160px]"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30 bg-white"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell align-top">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItem(idx, "note", e.target.value)}
                      placeholder="Ghi chú thêm"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0f2d5e]/30 min-w-[120px]"
                    />
                  </td>
                  <td className="px-2 py-2 align-top pt-3">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="p-1 text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-50">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0f2d5e] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm dòng vật tư
          </button>
        </div>
      </div>

      {role === "Admin" && quickMaterialRow !== null && selectedCategory && (
        <QuickMaterialModal
          category={selectedCategory}
          materials={materialItems}
          onClose={() => setQuickMaterialRow(null)}
          onCreated={handleQuickMaterialCreated}
        />
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/admin/tenders"
          className="px-5 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-center"
        >
          Hủy
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-2.5 text-sm font-medium border border-[#0f2d5e] text-[#0f2d5e] rounded-lg hover:bg-[#0f2d5e]/5 transition-colors"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="px-6 py-2.5 text-sm font-semibold bg-[#0f2d5e] text-white rounded-lg hover:bg-[#0d2550] transition-colors"
          >
            Phát hành gói thầu
          </button>
        </div>
      </div>
    </div>
  );
}
