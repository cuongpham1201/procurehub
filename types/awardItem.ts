export interface AwardItem {
  id: string;
  tenderId: string;
  tenderItemId: string;
  bidId: string;
  bidItemId?: string;
  supplierId?: string;
  supplierName?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAwardItemInput {
  tenderId: string;
  tenderItemId: string;
  bidId: string;
  bidItemId?: string;
  supplierId?: string;
  supplierName?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  note?: string;
}
