"use client";

import { useState } from "react";
import { createMaterialItem } from "@/services/categoryStorage";
import { addAdminActivityLog, actorFromSession } from "@/services/activityStorage";
import { getInternalSession } from "@/services/authStorage";
import type { MaterialItem, PurchaseCategory } from "@/types/category";

type QuickMaterialForm = {
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  description: string;
};

const EMPTY_FORM: QuickMaterialForm = {
  materialCode: "",
  materialName: "",
  specification: "",
  unit: "Cái",
  description: "",
};

const UNITS = ["Cái", "Bộ", "Kg", "Tấn", "Mét", "M²", "M³", "Lít", "Thùng", "Cuộn", "Hộp", "Gói"];

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

function sameCode(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function QuickMaterialModal({
  category,
  materials,
  onClose,
  onCreated,
}: {
  category: PurchaseCategory;
  materials: MaterialItem[];
  onClose: () => void;
  onCreated: (material: MaterialItem) => void;
}) {
  const [form, setForm] = useState<QuickMaterialForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof QuickMaterialForm | "duplicate", string>>>({});

  function setField(key: keyof QuickMaterialForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: key === "materialCode" ? value.toUpperCase() : value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.duplicate;
      return next;
    });
  }

  async function submit() {
    const nextErrors: Partial<Record<keyof QuickMaterialForm | "duplicate", string>> = {};
    const materialCode = form.materialCode.trim();
    const materialName = form.materialName.trim();
    const unit = form.unit.trim();

    if (!materialCode) nextErrors.materialCode = "Vui lòng nhập mã vật tư.";
    if (!materialName) nextErrors.materialName = "Vui lòng nhập tên vật tư.";
    if (!unit) nextErrors.unit = "Vui lòng nhập đơn vị.";
    if (materialCode && materials.some((item) => sameCode(item.materialCode, materialCode))) {
      nextErrors.duplicate = "Mã vật tư đã tồn tại trong danh mục.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const material = await createMaterialItem(
      {
        categoryId: category.id,
        categoryName: category.name,
        materialCode,
        materialName,
        specification: form.specification,
        unit,
        description: form.description,
        status: "Hoạt động",
      },
      { skipLog: true },
    );

    await addAdminActivityLog({
      type: "system",
      title: "Thêm mã vật tư",
      description: `Thêm nhanh ${material.materialCode} - ${material.materialName} khi tạo gói thầu`,
      entityType: "material",
      entityId: material.id,
      entityCode: material.materialCode,
      ...actorFromSession(getInternalSession()),
    });

    onCreated(material);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800">Tạo nhanh mã vật tư</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhóm mua sắm: <span className="font-medium text-slate-600">{category.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Đóng form tạo nhanh mã vật tư"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mã vật tư <span className="text-red-500">*</span></label>
              <input
                className={inputCls}
                value={form.materialCode}
                onChange={(e) => setField("materialCode", e.target.value)}
                placeholder="VD: NVL-THEP-Q345"
              />
              {errors.materialCode && <p className="text-xs text-red-500 mt-1">{errors.materialCode}</p>}
            </div>
            <div>
              <label className={labelCls}>Đơn vị <span className="text-red-500">*</span></label>
              <input
                className={inputCls}
                list="quick-material-unit-options"
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
                placeholder="VD: Tấn"
              />
              <datalist id="quick-material-unit-options">
                {UNITS.map((unit) => <option key={unit} value={unit} />)}
              </datalist>
              {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>Tên vật tư <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={form.materialName}
              onChange={(e) => setField("materialName", e.target.value)}
              placeholder="VD: Thép cuộn cán nóng Q345"
            />
            {errors.materialName && <p className="text-xs text-red-500 mt-1">{errors.materialName}</p>}
          </div>
          <div>
            <label className={labelCls}>Quy cách / Thông số</label>
            <input
              className={inputCls}
              value={form.specification}
              onChange={(e) => setField("specification", e.target.value)}
              placeholder="Quy cách, tiêu chuẩn nếu có"
            />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Ghi chú thêm cho danh mục vật tư"
            />
          </div>
          {errors.duplicate && <p className="text-xs text-red-500">{errors.duplicate}</p>}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
            >
              Lưu mã vật tư
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
