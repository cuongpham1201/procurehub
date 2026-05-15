export type BidStatus =
  | "Đã nộp"
  | "Chờ xem xét"
  | "Đang đánh giá"
  | "Cần bổ sung"
  | "Đã bổ sung"
  | "Được chọn"
  | "Không được chọn";

export interface BidItem {
  id: string;
  tenderItemId: string;
  itemName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number; // = quantity * unitPrice
  brand?: string;
  origin?: string;
  deliveryTime?: string;
  note?: string;
}

export interface SupplierBid {
  id: string;
  bidCode: string;
  tenderId: string;
  tenderCode: string;
  tenderTitle: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  status: BidStatus;
  submittedAt: string;
  totalAmount: number;
  deliveryTime?: string;
  paymentTerms?: string;
  warrantyPolicy?: string;
  note?: string;
  items: BidItem[];
  // Backward compat — old bids in localStorage may have these
  tenderName?: string;
  createdAt?: string;
  priceBeforeVat?: number;
  vatPercent?: number;
  totalPrice?: number;
  technicalNote?: string;
}
