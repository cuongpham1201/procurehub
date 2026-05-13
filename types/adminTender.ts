export type AdminTenderStatus =
  | "Nháp"
  | "Đang mở"
  | "Sắp đóng"
  | "Đã đóng"
  | "Đang đánh giá"
  | "Đã có kết quả"
  | "Đã hủy";

export type AdminTenderCategory = string;

export interface AdminTenderItem {
  id: string;
  materialId?: string;
  materialCode?: string;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  note: string;
}

export interface AdminTender {
  id: string;
  code: string;
  title: string;
  category: AdminTenderCategory;
  status: AdminTenderStatus;
  deadline: string;
  estimatedValue: number;
  description: string;
  deliveryLocation: string;
  deliveryTime: string;
  paymentTerms: string;
  documentRequirements: string[];
  items: AdminTenderItem[];
  createdAt: string;
  updatedAt?: string;
}
