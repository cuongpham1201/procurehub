import { apiDelete, apiGet, apiPost, apiPut } from "@/services/apiClient";
import { getBids, deleteBid } from "@/services/supplierBidStorage";
import {
  formatDisplayDate,
  getTodayDateString,
  isDateBeforeToday,
  isDateTodayOrFuture,
  toDateInputValue,
} from "@/services/dateUtils";
import type { AdminTender, AdminTenderStatus } from "@/types/adminTender";
import type { Tender, TenderStatus } from "@/types/tender";

const CLOSING_SOON_DAYS = 3;

function daysUntilDate(value: string): number | null {
  const dateValue = toDateInputValue(value);
  if (!dateValue) return null;
  const today = new Date(`${getTodayDateString()}T00:00:00`).getTime();
  const deadline = new Date(`${dateValue}T00:00:00`).getTime();
  if (isNaN(today) || isNaN(deadline)) return null;
  return Math.round((deadline - today) / 86_400_000);
}

function deadlineStatusForTender(tender: AdminTender): AdminTenderStatus {
  if (tender.status !== "Đang mở" && tender.status !== "Sắp đóng") {
    return tender.status;
  }
  if (isDateBeforeToday(tender.deadline)) return "Đã đóng";
  const daysLeft = daysUntilDate(tender.deadline);
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= CLOSING_SOON_DAYS) return "Sắp đóng";
  return "Đang mở";
}

export async function syncExpiredTenders(): Promise<AdminTender[]> {
  const existing = await apiGet<AdminTender[]>("/api/tenders").catch(() => []);
  const synced: AdminTender[] = [];

  for (const tender of existing) {
    const nextStatus = deadlineStatusForTender(tender);
    if (nextStatus === tender.status) {
      synced.push(tender);
      continue;
    }
    const updated: AdminTender = {
      ...tender,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await saveAdminTender(updated);
    synced.push(updated);
  }

  return synced;
}

export async function getTenders(): Promise<AdminTender[]> {
  return syncExpiredTenders();
}

export const getAdminTenders = getTenders;

export async function saveAdminTender(tender: AdminTender): Promise<void> {
  await apiPost<AdminTender>("/api/tenders", tender);
}

export async function updateAdminTenderStatus(id: string, status: AdminTenderStatus): Promise<void> {
  const tender = await getAdminTenderById(id);
  if (!tender) return;
  await apiPut<AdminTender>(`/api/tenders/${encodeURIComponent(tender.id)}`, {
    ...tender,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAdminTenderById(id: string): Promise<AdminTender | null> {
  try {
    return await apiGet<AdminTender | null>(`/api/tenders/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export const getTenderById = getAdminTenderById;

function isBidRelatedToTender(
  bid: { tenderId?: string; tenderCode?: string },
  tender: AdminTender,
): boolean {
  return (
    bid.tenderId === tender.id ||
    bid.tenderId === tender.code ||
    bid.tenderCode === tender.code ||
    bid.tenderCode === tender.id
  );
}

export async function deleteTender(id: string): Promise<void> {
  const tender = await getAdminTenderById(id);
  await apiDelete<boolean>(`/api/tenders/${encodeURIComponent(id)}`);
  if (!tender) return;
  const relatedBids = (await getBids()).filter((bid) => isBidRelatedToTender(bid, tender));
  await Promise.all(relatedBids.map((bid) => deleteBid(bid.id)));
}

export async function reopenTender(id: string, newDeadline: string): Promise<AdminTender | null> {
  const tender = await getAdminTenderById(id);
  if (!tender || tender.status !== "Đã đóng") return null;
  const normalizedDeadline = toDateInputValue(newDeadline);
  if (!normalizedDeadline || !isDateTodayOrFuture(normalizedDeadline)) return null;
  const updated: AdminTender = {
    ...tender,
    status: "Đang mở",
    deadline: normalizedDeadline,
    updatedAt: new Date().toISOString(),
  };
  await saveAdminTender(updated);
  return updated;
}

export async function generateTenderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const nums = (await getTenders())
    .map((t) => t.code)
    .filter((c) => c.startsWith(`GT-${year}-`))
    .map((c) => parseInt(c.slice(-3), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `GT-${year}-${String(next).padStart(3, "0")}`;
}

export function generateTenderId(): string {
  return `TENDER-${Date.now()}`;
}

export function ensureTenderSeedData(): void {
  // PostgreSQL is now the source of truth. Kept as a no-op for existing imports.
}

export async function resetTenderSeedData(): Promise<void> {
  // Demo reset is intentionally no longer localStorage-backed.
}

export function adminToPublicTender(t: AdminTender): Tender {
  const statusMap: Record<string, TenderStatus> = {
    "Đang mở": "Đang mở",
    "Sắp đóng": "Sắp đóng",
    "Đã đóng": "Đã đóng",
    "Đang đánh giá": "Đã đóng",
    "Đã có kết quả": "Đã có kết quả",
  };
  return {
    id: t.id,
    code: t.code,
    name: t.title,
    category: t.category,
    inviter: "Bia Hạ Long",
    deadline: formatDisplayDate(t.deadline),
    status: statusMap[t.status] ?? "Đã đóng",
    value:
      t.estimatedValue >= 1_000_000_000
        ? (t.estimatedValue / 1_000_000_000).toFixed(1) + " tỷ ₫"
        : t.estimatedValue >= 1_000_000
        ? (t.estimatedValue / 1_000_000).toFixed(0) + " triệu ₫"
        : t.estimatedValue > 0
        ? t.estimatedValue.toLocaleString("vi-VN") + " ₫"
        : "Đang cập nhật",
    description: t.description || "",
    items: (t.items ?? []).map((item) => ({
      materialId: item.materialId,
      materialCode: item.materialCode,
      name: item.itemName,
      spec: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note,
    })),
    commercialTerms: {
      deliveryLocation: t.deliveryLocation || "Theo hợp đồng",
      deliveryTime: t.deliveryTime || "Theo hợp đồng",
      paymentTerms: t.paymentTerms || "Theo hợp đồng",
      quotationRequirements: t.documentRequirements ?? [],
    },
    documents: [],
    timeline: [],
  };
}
