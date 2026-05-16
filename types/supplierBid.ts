export type BidStatus =
  | "Đã nộp"
  | "Đang xem xét"
  | "Cần làm rõ"
  | "Đã phản hồi"
  | "Đề xuất chọn"
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
  // Phase 2: snapshot fields (captured at submission) + per-line award status
  itemCode?: string;
  specificationSnapshot?: string;
  quantitySnapshot?: number;
  unitSnapshot?: string;
  itemStatus?: "pending" | "awarded" | "rejected";
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
  // Phase 2: revision tracking
  revisionNo?: number;
  parentBidId?: string;
  // Backward compat — old bids in localStorage may have these
  tenderName?: string;
  createdAt?: string;
  priceBeforeVat?: number;
  vatPercent?: number;
  totalPrice?: number;
  technicalNote?: string;
}
