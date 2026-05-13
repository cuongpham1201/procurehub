export type TenderStatus = "Đang mở" | "Sắp đóng" | "Đã đóng" | "Đã có kết quả";

export type TenderCategory = string;

export interface TenderItem {
  materialId?: string;
  materialCode?: string;
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  note?: string;
}

export interface TenderCommercialTerms {
  deliveryLocation: string;
  deliveryTime: string;
  paymentTerms: string;
  quotationRequirements: string[];
}

export interface TenderDocument {
  name: string;
  fileType: "PDF" | "DOCX" | "XLSX";
  size: string;
}

export interface TenderTimelineEvent {
  label: string;
  date: string;
  completed: boolean;
}

export interface Tender {
  id: string;
  code: string;
  name: string;
  category: TenderCategory;
  inviter: string;
  deadline: string;
  status: TenderStatus;
  value: string;
  description: string;
  items: TenderItem[];
  commercialTerms: TenderCommercialTerms;
  documents: TenderDocument[];
  timeline: TenderTimelineEvent[];
}
