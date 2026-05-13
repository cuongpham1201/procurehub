export type CatalogStatus = "Hoạt động" | "Tạm khóa";

export interface PurchaseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface MaterialItem {
  id: string;
  categoryId: string;
  categoryName: string;
  materialCode: string;
  materialName: string;
  specification?: string;
  unit: string;
  description?: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt?: string;
}

