import { apiDelete, apiGet, apiPost, apiPut } from "@/services/apiClient";
import type { SupplierBid, BidStatus } from "@/types/supplierBid";

export async function getBids(): Promise<SupplierBid[]> {
  try {
    return await apiGet<SupplierBid[]>("/api/bids");
  } catch {
    return [];
  }
}

export async function saveBid(bid: SupplierBid): Promise<void> {
  await apiPost<SupplierBid>("/api/bids", bid);
}

export async function updateBid(bid: SupplierBid): Promise<void> {
  await apiPut<SupplierBid>(`/api/bids/${encodeURIComponent(bid.id)}`, bid);
}

export async function getBidById(id: string): Promise<SupplierBid | undefined> {
  try {
    return await apiGet<SupplierBid>(`/api/bids/${encodeURIComponent(id)}`);
  } catch {
    return undefined;
  }
}

export async function getBidsBySupplier(supplierId: string): Promise<SupplierBid[]> {
  try {
    return await apiGet<SupplierBid[]>(`/api/bids?supplierId=${encodeURIComponent(supplierId)}`);
  } catch {
    return [];
  }
}

export async function getBidsByTender(tenderId: string): Promise<SupplierBid[]> {
  try {
    return await apiGet<SupplierBid[]>(`/api/bids?tenderId=${encodeURIComponent(tenderId)}`);
  } catch {
    return [];
  }
}

export async function updateBidStatus(id: string, status: BidStatus): Promise<void> {
  const bid = (await getBidById(id));
  if (!bid) return;
  await apiPut<SupplierBid>(`/api/bids/${encodeURIComponent(id)}`, { ...bid, status });
}

export async function markBidAsWinner(winningBidId: string, tenderId: string): Promise<void> {
  const bids = await getBids();
  await Promise.all(
    bids
      .filter((b) => b.tenderId === tenderId)
      .map((b) => {
        const status: BidStatus = b.id === winningBidId ? "Được chọn" : "Không được chọn";
        return apiPut<SupplierBid>(`/api/bids/${encodeURIComponent(b.id)}`, { ...b, status });
      }),
  );
}

export async function generateBidCode(): Promise<string> {
  try {
    return await apiGet<string>("/api/bids/next-code");
  } catch {
    // Fallback client-side nếu API không khả dụng
    const year = new Date().getFullYear();
    return `BG-${year}-${String(Date.now()).slice(-3)}`;
  }
}

export function generateBidId(): string {
  return `BID-${Date.now()}`;
}

export async function deleteBid(id: string): Promise<void> {
  await apiDelete<boolean>(`/api/bids/${encodeURIComponent(id)}`);
}
