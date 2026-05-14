import { apiGet, apiPost, apiPut } from "@/services/apiClient";
import type { CatalogStatus, MaterialItem, PurchaseCategory } from "@/types/category";

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

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function getPurchaseCategories(): Promise<PurchaseCategory[]> {
  try {
    return await apiGet<PurchaseCategory[]>("/api/procurement-groups");
  } catch {
    return [];
  }
}

export async function createPurchaseCategory(data: PurchaseCategoryInput): Promise<PurchaseCategory> {
  const now = new Date().toISOString();
  const category: PurchaseCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: normalizeCode(data.code),
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    status: data.status ?? "Hoạt động",
    createdAt: now,
  };
  const saved = await apiPost<PurchaseCategory>("/api/procurement-groups", category);
  return saved;
}

export async function updatePurchaseCategory(
  id: string,
  patch: Partial<PurchaseCategoryInput>,
): Promise<PurchaseCategory | null> {
  const categories = await getPurchaseCategories();
  const current = categories.find((category) => category.id === id);
  if (!current) return null;

  const updated: PurchaseCategory = {
    ...current,
    code: patch.code !== undefined ? normalizeCode(patch.code) : current.code,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    description: patch.description !== undefined ? patch.description.trim() || undefined : current.description,
    status: patch.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  const saved = await apiPut<PurchaseCategory>(`/api/procurement-groups/${encodeURIComponent(id)}`, updated);

  if (saved.name !== current.name) {
    const materials = await getMaterialItems();
    await Promise.all(
      materials
        .filter((item) => item.categoryId === saved.id)
        .map((item) =>
          updateMaterialItem(item.id, {
            categoryId: saved.id,
            categoryName: saved.name,
            materialCode: item.materialCode,
            materialName: item.materialName,
            specification: item.specification,
            unit: item.unit,
            description: item.description,
            status: item.status,
          }),
        ),
    );
  }

  return saved;
}

export async function togglePurchaseCategoryStatus(id: string): Promise<PurchaseCategory | null> {
  const category = (await getPurchaseCategories()).find((item) => item.id === id);
  if (!category) return null;
  const nextStatus: CatalogStatus = category.status === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
  return updatePurchaseCategory(id, { status: nextStatus });
}

export async function getMaterialItems(): Promise<MaterialItem[]> {
  try {
    return await apiGet<MaterialItem[]>("/api/material-items");
  } catch {
    return [];
  }
}

export async function getMaterialItemsByCategory(categoryId: string): Promise<MaterialItem[]> {
  return (await getMaterialItems()).filter((item) => item.categoryId === categoryId);
}

export async function createMaterialItem(
  data: MaterialItemInput,
  options?: { skipLog?: boolean },
): Promise<MaterialItem> {
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
  const saved = await apiPost<MaterialItem>("/api/material-items", item);
  void options;
  return saved;
}

export async function updateMaterialItem(
  id: string,
  patch: Partial<MaterialItemInput>,
): Promise<MaterialItem | null> {
  const current = (await getMaterialItems()).find((item) => item.id === id);
  if (!current) return null;

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

  const saved = await apiPut<MaterialItem>(`/api/material-items/${encodeURIComponent(id)}`, updated);
  return saved;
}

export async function toggleMaterialItemStatus(id: string): Promise<MaterialItem | null> {
  const item = (await getMaterialItems()).find((material) => material.id === id);
  if (!item) return null;
  const nextStatus: CatalogStatus = item.status === "Hoạt động" ? "Tạm khóa" : "Hoạt động";
  return updateMaterialItem(id, {
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    materialCode: item.materialCode,
    materialName: item.materialName,
    specification: item.specification,
    unit: item.unit,
    description: item.description,
    status: nextStatus,
  });
}

export function ensureCategorySeedData(): void {
  // PostgreSQL import/migration is now responsible for seed data.
}
