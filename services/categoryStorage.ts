import { addAdminActivityLog, actorFromSession } from "@/services/activityStorage";
import { getInternalSession } from "@/services/authStorage";
import type { CatalogStatus, MaterialItem, PurchaseCategory } from "@/types/category";

const CATEGORY_KEY = "procurehub_purchase_categories";
const MATERIAL_KEY = "procurehub_material_items";

type PurchaseCategoryInput = {
  code: string;
  name: string;
  description?: string;
  status?: CatalogStatus;
};

type MaterialItemInput = {
  categoryId: string;
  categoryName: string;
  materialCode: string;
  materialName: string;
  specification?: string;
  unit: string;
  description?: string;
  status?: CatalogStatus;
};

const SEED_CREATED_AT = "2025-01-01T00:00:00.000Z";

const SEED_CATEGORIES: PurchaseCategory[] = [
  { id: "cat-nvl", code: "NVL", name: "Nguyên vật liệu", status: "Hoạt động", createdAt: SEED_CREATED_AT },
  { id: "cat-mm", code: "MM", name: "Máy móc", status: "Hoạt động", createdAt: SEED_CREATED_AT },
  { id: "cat-tb", code: "TB", name: "Thiết bị", status: "Hoạt động", createdAt: SEED_CREATED_AT },
  { id: "cat-ccdc", code: "CCDC", name: "Công cụ dụng cụ", status: "Hoạt động", createdAt: SEED_CREATED_AT },
  { id: "cat-dv", code: "DV", name: "Dịch vụ phụ trợ", status: "Hoạt động", createdAt: SEED_CREATED_AT },
];

const SEED_MATERIALS = [
  { categoryCode: "NVL", materialCode: "NVL-THEP-Q195", materialName: "Thép cuộn cán nóng Q195", unit: "Tấn" },
  { categoryCode: "NVL", materialCode: "NVL-THEP-Q235", materialName: "Thép cuộn cán nóng Q235", unit: "Tấn" },
  { categoryCode: "NVL", materialCode: "NVL-VO-LON-330", materialName: "Vỏ lon nhôm 330ml", unit: "Cái" },
  { categoryCode: "MM", materialCode: "MM-MAY-NEN-KHI", materialName: "Máy nén khí trục vít", unit: "Bộ" },
  { categoryCode: "TB", materialCode: "TB-CMM-3D", materialName: "Máy đo tọa độ 3D CMM", unit: "Bộ" },
  { categoryCode: "TB", materialCode: "TB-DO-APSUAT", materialName: "Thiết bị đo áp suất nồi hơi", unit: "Bộ" },
  { categoryCode: "CCDC", materialCode: "CCDC-DAO-PHAY", materialName: "Dao phay kim loại", unit: "Cái" },
  { categoryCode: "CCDC", materialCode: "CCDC-MUI-KHOAN", materialName: "Mũi khoan", unit: "Cái" },
  { categoryCode: "DV", materialCode: "DV-VE-SINH-CN", materialName: "Dịch vụ vệ sinh công nghiệp", unit: "Gói" },
  { categoryCode: "DV", materialCode: "DV-BAO-TRI-DIEN", materialName: "Dịch vụ bảo trì hệ thống điện", unit: "Gói" },
];

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(list));
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function logCatalogChange(description: string): void {
  addAdminActivityLog({
    type: "system",
    title: "Cập nhật danh mục mua sắm",
    description,
    ...actorFromSession(getInternalSession()),
  });
}

export function getPurchaseCategories(): PurchaseCategory[] {
  return readList<PurchaseCategory>(CATEGORY_KEY).sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" }),
  );
}

export function createPurchaseCategory(data: PurchaseCategoryInput): PurchaseCategory {
  const now = new Date().toISOString();
  const category: PurchaseCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: normalizeCode(data.code),
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    status: data.status ?? "Hoạt động",
    createdAt: now,
  };
  writeList(CATEGORY_KEY, [...getPurchaseCategories(), category]);
  logCatalogChange(`Thêm nhóm mua sắm ${category.code} — ${category.name}`);
  return category;
}

export function updatePurchaseCategory(
  id: string,
  patch: Partial<PurchaseCategoryInput>,
): PurchaseCategory | null {
  const categories = getPurchaseCategories();
  const idx = categories.findIndex((category) => category.id === id);
  if (idx < 0) return null;

  const current = categories[idx];
  const updated: PurchaseCategory = {
    ...current,
    code: patch.code !== undefined ? normalizeCode(patch.code) : current.code,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    description: patch.description !== undefined ? patch.description.trim() || undefined : current.description,
    status: patch.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  categories[idx] = updated;
  writeList(CATEGORY_KEY, categories);

  if (updated.name !== current.name) {
    const materials = getMaterialItems().map((item) =>
      item.categoryId === updated.id
        ? { ...item, categoryName: updated.name, updatedAt: updated.updatedAt }
        : item,
    );
    writeList(MATERIAL_KEY, materials);
  }

  logCatalogChange(`Sửa nhóm mua sắm ${updated.code} — ${updated.name}`);
  return updated;
}

export function togglePurchaseCategoryStatus(id: string): PurchaseCategory | null {
  const categories = getPurchaseCategories();
  const idx = categories.findIndex((category) => category.id === id);
  if (idx < 0) return null;

  const nextStatus: CatalogStatus = categories[idx].status === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
  const updated = {
    ...categories[idx],
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  categories[idx] = updated;
  writeList(CATEGORY_KEY, categories);
  logCatalogChange(`${nextStatus === "Tạm khóa" ? "Khóa" : "Mở khóa"} nhóm mua sắm ${updated.code} — ${updated.name}`);
  return updated;
}

export function getMaterialItems(): MaterialItem[] {
  return readList<MaterialItem>(MATERIAL_KEY).sort((a, b) =>
    a.materialCode.localeCompare(b.materialCode, "vi", { sensitivity: "base", numeric: true }),
  );
}

export function getMaterialItemsByCategory(categoryId: string): MaterialItem[] {
  return getMaterialItems().filter((item) => item.categoryId === categoryId);
}

export function createMaterialItem(
  data: MaterialItemInput,
  options?: { skipLog?: boolean },
): MaterialItem {
  const now = new Date().toISOString();
  const item: MaterialItem = {
    id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    categoryId: data.categoryId,
    categoryName: data.categoryName.trim(),
    materialCode: normalizeCode(data.materialCode),
    materialName: data.materialName.trim(),
    specification: data.specification?.trim() || undefined,
    unit: data.unit.trim(),
    description: data.description?.trim() || undefined,
    status: data.status ?? "Hoạt động",
    createdAt: now,
  };
  writeList(MATERIAL_KEY, [...getMaterialItems(), item]);
  if (!options?.skipLog) {
    logCatalogChange(`Thêm mã vật tư ${item.materialCode} — ${item.materialName}`);
  }
  return item;
}

export function updateMaterialItem(
  id: string,
  patch: Partial<MaterialItemInput>,
): MaterialItem | null {
  const materials = getMaterialItems();
  const idx = materials.findIndex((item) => item.id === id);
  if (idx < 0) return null;

  const current = materials[idx];
  const updated: MaterialItem = {
    ...current,
    categoryId: patch.categoryId ?? current.categoryId,
    categoryName: patch.categoryName !== undefined ? patch.categoryName.trim() : current.categoryName,
    materialCode: patch.materialCode !== undefined ? normalizeCode(patch.materialCode) : current.materialCode,
    materialName: patch.materialName !== undefined ? patch.materialName.trim() : current.materialName,
    specification: patch.specification !== undefined ? patch.specification.trim() || undefined : current.specification,
    unit: patch.unit !== undefined ? patch.unit.trim() : current.unit,
    description: patch.description !== undefined ? patch.description.trim() || undefined : current.description,
    status: patch.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  materials[idx] = updated;
  writeList(MATERIAL_KEY, materials);
  logCatalogChange(`Sửa mã vật tư ${updated.materialCode} — ${updated.materialName}`);
  return updated;
}

export function toggleMaterialItemStatus(id: string): MaterialItem | null {
  const materials = getMaterialItems();
  const idx = materials.findIndex((item) => item.id === id);
  if (idx < 0) return null;

  const nextStatus: CatalogStatus = materials[idx].status === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
  const updated = {
    ...materials[idx],
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  materials[idx] = updated;
  writeList(MATERIAL_KEY, materials);
  logCatalogChange(`${nextStatus === "Tạm khóa" ? "Khóa" : "Mở khóa"} mã vật tư ${updated.materialCode} — ${updated.materialName}`);
  return updated;
}

export function ensureCategorySeedData(): void {
  if (typeof window === "undefined") return;

  if (localStorage.getItem(CATEGORY_KEY) === null) {
    writeList(CATEGORY_KEY, SEED_CATEGORIES);
  }

  if (localStorage.getItem(MATERIAL_KEY) === null) {
    const categories = getPurchaseCategories();
    const seededMaterials: MaterialItem[] = SEED_MATERIALS.flatMap((seed, index) => {
      const category = categories.find((item) => item.code === seed.categoryCode);
      if (!category) return [];
      return [{
        id: `mat-seed-${index + 1}`,
        categoryId: category.id,
        categoryName: category.name,
        materialCode: seed.materialCode,
        materialName: seed.materialName,
        unit: seed.unit,
        status: "Hoạt động",
        createdAt: SEED_CREATED_AT,
      }];
    });
    writeList(MATERIAL_KEY, seededMaterials);
  }
}
