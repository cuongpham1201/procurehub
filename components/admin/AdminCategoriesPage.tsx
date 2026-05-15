"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMaterialItem,
  createPurchaseCategory,
  ensureCategorySeedData,
  getMaterialItems,
  getPurchaseCategories,
  toggleMaterialItemStatus,
  togglePurchaseCategoryStatus,
  updateMaterialItem,
  updatePurchaseCategory,
} from "@/services/categoryStorage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CatalogStatus, MaterialItem, PurchaseCategory } from "@/types/category";

type Tab = "categories" | "materials";
type FormMode = "create" | "edit";

type CategoryForm = {
  code: string;
  name: string;
  description: string;
  status: CatalogStatus;
};

type MaterialForm = {
  categoryId: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  description: string;
  status: CatalogStatus;
};

const EMPTY_CATEGORY_FORM: CategoryForm = {
  code: "",
  name: "",
  description: "",
  status: "Hoạt động",
};

const EMPTY_MATERIAL_FORM: MaterialForm = {
  categoryId: "",
  materialCode: "",
  materialName: "",
  specification: "",
  unit: "Cái",
  description: "",
  status: "Hoạt động",
};

const UNITS = ["Cái", "Bộ", "Kg", "Tấn", "Mét", "M²", "M³", "Lít", "Thùng", "Cuộn", "Hộp", "Gói"];

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white";
const labelCls = "block text-xs font-medium text-slate-500 mb-1";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function StatusBadge({ status }: { status: CatalogStatus }) {
  const cls =
    status === "Hoạt động"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-500";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "green" | "slate";
}) {
  const styles = {
    blue: "bg-blue-50 text-[#0f2d5e]",
    green: "bg-green-50 text-green-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`${styles[tone]} rounded-xl p-4`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { user: currentUser } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const role = currentUser?.role ?? "Chỉ xem";
  const [categorySearch, setCategorySearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("");
  const [categoryMode, setCategoryMode] = useState<FormMode | null>(null);
  const [categoryEditingId, setCategoryEditingId] = useState("");
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM);
  const [materialMode, setMaterialMode] = useState<FormMode | null>(null);
  const [materialEditingId, setMaterialEditingId] = useState("");
  const [materialForm, setMaterialForm] = useState<MaterialForm>(EMPTY_MATERIAL_FORM);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isAdmin = role === "Admin";

  async function reloadData() {
    const [nextCategories, nextMaterials] = await Promise.all([getPurchaseCategories(), getMaterialItems()]);
    setCategories(nextCategories);
    setMaterials(nextMaterials);
  }

  useEffect(() => {
    ensureCategorySeedData();
    reloadData();
  }, []);

  const materialCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    materials.forEach((item) => {
      map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + 1);
    });
    return map;
  }, [materials]);

  const filteredCategories = useMemo(() => {
    const q = normalizeText(categorySearch);
    return categories.filter((category) => {
      if (!q) return true;
      return (
        normalizeText(category.code).includes(q) ||
        normalizeText(category.name).includes(q)
      );
    });
  }, [categories, categorySearch]);

  const filteredMaterials = useMemo(() => {
    const q = normalizeText(materialSearch);
    return materials.filter((item) => {
      const matchSearch =
        !q ||
        normalizeText(item.materialCode).includes(q) ||
        normalizeText(item.materialName).includes(q) ||
        normalizeText(item.specification ?? "").includes(q);
      const matchCategory = !materialCategoryFilter || item.categoryId === materialCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [materials, materialCategoryFilter, materialSearch]);

  const categorySummary = {
    total: categories.length,
    active: categories.filter((item) => item.status === "Hoạt động").length,
    locked: categories.filter((item) => item.status === "Tạm khóa").length,
  };

  const materialSummary = {
    total: materials.length,
    active: materials.filter((item) => item.status === "Hoạt động").length,
    locked: materials.filter((item) => item.status === "Tạm khóa").length,
  };

  function showSuccess(message: string) {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(""), 3500);
  }

  function openCreateCategory() {
    if (!isAdmin) return;
    setCategoryMode("create");
    setCategoryEditingId("");
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setFormError("");
  }

  function openEditCategory(category: PurchaseCategory) {
    if (!isAdmin) return;
    setCategoryMode("edit");
    setCategoryEditingId(category.id);
    setCategoryForm({
      code: category.code,
      name: category.name,
      description: category.description ?? "",
      status: category.status,
    });
    setFormError("");
  }

  function closeCategoryForm() {
    setCategoryMode(null);
    setCategoryEditingId("");
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setFormError("");
  }

  async function submitCategoryForm() {
    if (!isAdmin) return;
    const code = categoryForm.code.trim().toUpperCase();
    const name = categoryForm.name.trim();
    if (!code || !name) {
      setFormError("Vui lòng nhập mã nhóm và tên nhóm mua sắm.");
      return;
    }

    const duplicate = categories.some(
      (item) =>
        item.id !== categoryEditingId &&
        (item.code.toUpperCase() === code || normalizeText(item.name) === normalizeText(name)),
    );
    if (duplicate) {
      setFormError("Mã nhóm hoặc tên nhóm đã tồn tại.");
      return;
    }

    if (categoryMode === "edit") {
      await updatePurchaseCategory(categoryEditingId, {
        code,
        name,
        description: categoryForm.description,
        status: categoryForm.status,
      });
      showSuccess("Đã cập nhật nhóm mua sắm.");
    } else {
      await createPurchaseCategory({
        code,
        name,
        description: categoryForm.description,
        status: categoryForm.status,
      });
      showSuccess("Đã thêm nhóm mua sắm.");
    }
    closeCategoryForm();
    await reloadData();
  }

  async function handleToggleCategory(category: PurchaseCategory) {
    if (!isAdmin) return;
    await togglePurchaseCategoryStatus(category.id);
    await reloadData();
    showSuccess(category.status === "Hoạt động" ? "Đã khóa nhóm mua sắm." : "Đã mở khóa nhóm mua sắm.");
  }

  function openCreateMaterial() {
    if (!isAdmin) return;
    setMaterialMode("create");
    setMaterialEditingId("");
    setMaterialForm({
      ...EMPTY_MATERIAL_FORM,
      categoryId: categories.find((item) => item.status === "Hoạt động")?.id ?? categories[0]?.id ?? "",
    });
    setFormError("");
    setTab("materials");
  }

  function openEditMaterial(item: MaterialItem) {
    if (!isAdmin) return;
    setMaterialMode("edit");
    setMaterialEditingId(item.id);
    setMaterialForm({
      categoryId: item.categoryId,
      materialCode: item.materialCode,
      materialName: item.materialName,
      specification: item.specification ?? "",
      unit: item.unit,
      description: item.description ?? "",
      status: item.status,
    });
    setFormError("");
    setTab("materials");
  }

  function closeMaterialForm() {
    setMaterialMode(null);
    setMaterialEditingId("");
    setMaterialForm(EMPTY_MATERIAL_FORM);
    setFormError("");
  }

  async function submitMaterialForm() {
    if (!isAdmin) return;
    const category = categories.find((item) => item.id === materialForm.categoryId);
    const materialCode = materialForm.materialCode.trim().toUpperCase();
    const materialName = materialForm.materialName.trim();
    const unit = materialForm.unit.trim();
    if (!category || !materialCode || !materialName || !unit) {
      setFormError("Vui lòng nhập đủ nhóm mua sắm, mã vật tư, tên vật tư và đơn vị.");
      return;
    }

    const duplicate = materials.some(
      (item) => item.id !== materialEditingId && item.materialCode.toUpperCase() === materialCode,
    );
    if (duplicate) {
      setFormError("Mã vật tư đã tồn tại.");
      return;
    }

    const payload = {
      categoryId: category.id,
      categoryName: category.name,
      materialCode,
      materialName,
      specification: materialForm.specification,
      unit,
      description: materialForm.description,
      status: materialForm.status,
    };

    if (materialMode === "edit") {
      await updateMaterialItem(materialEditingId, payload);
      showSuccess("Đã cập nhật mã vật tư.");
    } else {
      await createMaterialItem(payload);
      showSuccess("Đã thêm mã vật tư.");
    }
    closeMaterialForm();
    await reloadData();
  }

  async function handleToggleMaterial(item: MaterialItem) {
    if (!isAdmin) return;
    await toggleMaterialItemStatus(item.id);
    await reloadData();
    showSuccess(item.status === "Hoạt động" ? "Đã khóa mã vật tư." : "Đã mở khóa mã vật tư.");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nhóm mua sắm</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý nhóm mua sắm và danh mục mã vật tư dùng khi tạo gói thầu.
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={openCreateCategory}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white text-sm font-medium rounded-lg hover:bg-[#0d2550] transition-colors"
            >
              <span>+</span>
              Thêm nhóm
            </button>
            <button
              type="button"
              onClick={openCreateMaterial}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#0f2d5e] text-[#0f2d5e] text-sm font-medium rounded-lg hover:bg-[#0f2d5e]/5 transition-colors"
            >
              <span>+</span>
              Thêm mã vật tư
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-sm">
          Bạn đang xem danh mục ở chế độ chỉ xem. Chỉ role Admin được thêm, sửa hoặc khóa dữ liệu.
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex gap-1">
        {[
          { key: "categories" as const, label: "Nhóm mua sắm" },
          { key: "materials" as const, label: "Mã vật tư" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-[#0f2d5e] text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard label="Tổng nhóm" value={categorySummary.total} tone="blue" />
            <SummaryCard label="Đang hoạt động" value={categorySummary.active} tone="green" />
            <SummaryCard label="Tạm khóa" value={categorySummary.locked} tone="slate" />
          </div>

          {categoryMode && isAdmin && (
            <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                <h3 className="font-semibold text-slate-700 text-sm">
                  {categoryMode === "edit" ? "Sửa nhóm mua sắm" : "Thêm nhóm mua sắm"}
                </h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mã nhóm *</label>
                  <input
                    className={inputCls}
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: NVL"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tên nhóm *</label>
                  <input
                    className={inputCls}
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Nguyên vật liệu"
                  />
                </div>
                <div>
                  <label className={labelCls}>Trạng thái</label>
                  <select
                    className={inputCls}
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, status: e.target.value as CatalogStatus }))}
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Tạm khóa">Tạm khóa</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Mô tả</label>
                  <input
                    className={inputCls}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả ngắn nếu cần"
                  />
                </div>
                {formError && <p className="sm:col-span-2 text-xs text-red-500">{formError}</p>}
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCategoryForm}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={submitCategoryForm}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                  >
                    Lưu nhóm
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <input
              className={inputCls}
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên nhóm..."
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Mã nhóm</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Tên nhóm</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Mô tả</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Trạng thái</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">Số mã vật tư</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{category.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{category.name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{category.description || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={category.status} /></td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {materialCountByCategory.get(category.id) ?? 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditCategory(category)}
                              className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleCategory(category)}
                              className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
                            >
                              {category.status === "Hoạt động" ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                        Không tìm thấy nhóm mua sắm phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "materials" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard label="Tổng mã vật tư" value={materialSummary.total} tone="blue" />
            <SummaryCard label="Đang hoạt động" value={materialSummary.active} tone="green" />
            <SummaryCard label="Tạm khóa" value={materialSummary.locked} tone="slate" />
          </div>

          {materialMode && isAdmin && (
            <section className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
                <h3 className="font-semibold text-slate-700 text-sm">
                  {materialMode === "edit" ? "Sửa mã vật tư" : "Thêm mã vật tư"}
                </h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nhóm mua sắm *</label>
                  <select
                    className={inputCls}
                    value={materialForm.categoryId}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Chọn nhóm mua sắm</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.code} — {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Mã vật tư *</label>
                  <input
                    className={inputCls}
                    value={materialForm.materialCode}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, materialCode: e.target.value.toUpperCase() }))}
                    placeholder="VD: NVL-THEP-Q195"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tên vật tư *</label>
                  <input
                    className={inputCls}
                    value={materialForm.materialName}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, materialName: e.target.value }))}
                    placeholder="VD: Thép cuộn cán nóng Q195"
                  />
                </div>
                <div>
                  <label className={labelCls}>Đơn vị *</label>
                  <input
                    className={inputCls}
                    list="material-unit-options"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="VD: Tấn"
                  />
                  <datalist id="material-unit-options">
                    {UNITS.map((unit) => <option key={unit} value={unit} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Quy cách</label>
                  <input
                    className={inputCls}
                    value={materialForm.specification}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, specification: e.target.value }))}
                    placeholder="Quy cách, thông số nếu có"
                  />
                </div>
                <div>
                  <label className={labelCls}>Trạng thái</label>
                  <select
                    className={inputCls}
                    value={materialForm.status}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, status: e.target.value as CatalogStatus }))}
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Tạm khóa">Tạm khóa</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Mô tả</label>
                  <input
                    className={inputCls}
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả thêm nếu cần"
                  />
                </div>
                {formError && <p className="sm:col-span-2 text-xs text-red-500">{formError}</p>}
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={closeMaterialForm}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={submitMaterialForm}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0f2d5e] text-white hover:bg-[#0d2550] transition-colors"
                  >
                    Lưu mã vật tư
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
            <input
              className={inputCls}
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              placeholder="Tìm theo mã, tên hoặc quy cách..."
            />
            <select
              className="sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 focus:border-[#0f2d5e] bg-white"
              value={materialCategoryFilter}
              onChange={(e) => setMaterialCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả nhóm mua sắm</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Mã vật tư</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Tên vật tư</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nhóm mua sắm</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Quy cách</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Đơn vị</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{item.materialCode}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.materialName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.categoryName}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{item.specification || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.unit}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditMaterial(item)}
                              className="text-xs font-medium text-[#0f2d5e] hover:text-[#c9a227] transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMaterial(item)}
                              className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
                            >
                              {item.status === "Hoạt động" ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                        Không tìm thấy mã vật tư phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
