import type { AdminTender, AdminTenderStatus } from "@/types/adminTender";
import type { Tender, TenderStatus } from "@/types/tender";
import { addAdminActivityLog } from "@/services/activityStorage";
import { formatDisplayDate, getTodayDateString, isDateBeforeToday, isDateTodayOrFuture, toDateInputValue } from "@/services/dateUtils";
import { initDemoDataIfEmpty, resetDemoData } from "@/services/demoDataStorage";

const KEY = "procurehub_admin_tenders";
const BIDS_KEY = "procurehub_supplier_bids";
const CLOSING_SOON_DAYS = 3;

// ── Đọc / ghi cơ bản ────────────────────────────────────────────────────────

function readStoredTenders(): AdminTender[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminTender[]) : [];
  } catch {
    return [];
  }
}

function writeStoredTenders(tenders: AdminTender[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(tenders));
}

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

  if (isDateBeforeToday(tender.deadline)) {
    return "Đã đóng";
  }

  const daysLeft = daysUntilDate(tender.deadline);
  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= CLOSING_SOON_DAYS) {
    return "Sắp đóng";
  }

  return "Đang mở";
}

export function syncExpiredTenders(): AdminTender[] {
  if (typeof window === "undefined") return [];
  initDemoDataIfEmpty();
  const existing = readStoredTenders();
  const closedTenders: AdminTender[] = [];
  const closingSoonTenders: AdminTender[] = [];
  let changed = false;
  const now = new Date().toISOString();
  const synced = existing.map((tender) => {
    const nextStatus = deadlineStatusForTender(tender);
    if (nextStatus === tender.status) {
      return tender;
    }
    changed = true;
    const updated: AdminTender = {
      ...tender,
      status: nextStatus,
      updatedAt: now,
    };
    if (nextStatus === "Đã đóng") closedTenders.push(updated);
    if (nextStatus === "Sắp đóng") closingSoonTenders.push(updated);
    return updated;
  });

  if (!changed) return existing;

  writeStoredTenders(synced);
  closingSoonTenders.forEach((tender) => {
    addAdminActivityLog({
      type: "tender_status",
      title: "Tự động đánh dấu sắp đóng",
      description: `${tender.code} còn không quá ${CLOSING_SOON_DAYS} ngày đến hạn nộp và được chuyển sang Sắp đóng`,
      entityType: "tender",
      entityId: tender.id,
      entityCode: tender.code,
    });
  });
  closedTenders.forEach((tender) => {
    addAdminActivityLog({
      type: "tender_status",
      title: "Tự động đóng gói thầu",
      description: `${tender.code} đã quá hạn nộp và được chuyển sang Đã đóng`,
      entityType: "tender",
      entityId: tender.id,
      entityCode: tender.code,
    });
  });
  return synced;
}

export function getTenders(): AdminTender[] {
  return syncExpiredTenders();
}

// alias giữ nguyên tên cũ để không phá import hiện có
export const getAdminTenders = getTenders;

export function saveAdminTender(tender: AdminTender): void {
  const existing = getTenders();
  const idx = existing.findIndex((t) => t.id === tender.id);
  if (idx >= 0) {
    existing[idx] = tender;
  } else {
    existing.push(tender);
  }
  writeStoredTenders(existing);
}

export function updateAdminTenderStatus(id: string, status: AdminTenderStatus): void {
  const list = getTenders().map((t) =>
    t.id === id || t.code === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
  );
  writeStoredTenders(list);
}

export function getAdminTenderById(id: string): AdminTender | null {
  return getTenders().find((t) => t.id === id || t.code === id) ?? null;
}

// alias theo tên mới
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

function getBidsForTender(tender: AdminTender): { tenderId?: string; tenderCode?: string }[] {
  try {
    const raw = localStorage.getItem(BIDS_KEY);
    const bids = raw ? (JSON.parse(raw) as { tenderId?: string; tenderCode?: string }[]) : [];
    return bids.filter((b) => isBidRelatedToTender(b, tender));
  } catch {
    return [];
  }
}

export function deleteTender(id: string): void {
  const tender = getAdminTenderById(id);
  const remaining = getTenders().filter((t) => t.id !== id && t.code !== id);
  writeStoredTenders(remaining);
  if (!tender) return;
  try {
    const raw = localStorage.getItem(BIDS_KEY);
    const bids = raw ? (JSON.parse(raw) as { tenderId?: string; tenderCode?: string }[]) : [];
    const cleaned = bids.filter((b) => !isBidRelatedToTender(b, tender));
    localStorage.setItem(BIDS_KEY, JSON.stringify(cleaned));
  } catch {
    // Không chặn thao tác xóa gói thầu nếu dữ liệu báo giá test bị lỗi.
  }
}

export function reopenTender(id: string, newDeadline: string): AdminTender | null {
  const tender = getAdminTenderById(id);
  if (!tender || tender.status !== "Đã đóng") return null;
  const normalizedDeadline = toDateInputValue(newDeadline);
  if (!normalizedDeadline || !isDateTodayOrFuture(normalizedDeadline)) return null;
  const updated = {
    ...tender,
    status: "Đang mở" as AdminTenderStatus,
    deadline: normalizedDeadline,
    updatedAt: new Date().toISOString(),
  };
  saveAdminTender(updated);
  return updated;
}

export function generateTenderCode(): string {
  const year = new Date().getFullYear();
  const existing = getTenders();
  const nums = existing
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

/**
 * Seed dữ liệu demo vào localStorage nếu browser chưa có dữ liệu ProcureHub.
 * Không ghi đè dữ liệu đã có.
 */
export function ensureTenderSeedData(): void {
  initDemoDataIfEmpty();
}

/**
 * Xóa dữ liệu demo chính rồi seed lại từ đầu.
 * Chỉ dùng trong dev/test — không gọi khi production.
 */
export function resetTenderSeedData(): void {
  resetDemoData();
}

// ── Chuyển đổi AdminTender → Tender (public shape) ──────────────────────────

export function adminToPublicTender(t: AdminTender): Tender {
  const statusMap: Record<string, TenderStatus> = {
    "Đang mở":       "Đang mở",
    "Sắp đóng":      "Sắp đóng",
    "Đã đóng":       "Đã đóng",
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
