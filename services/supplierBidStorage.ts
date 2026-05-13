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

export async function getBidById(id: string): Promise<SupplierBid | undefined> {
  return (await getBids()).find((b) => b.id === id);
}

export async function getBidsBySupplier(supplierId: string): Promise<SupplierBid[]> {
  return (await getBids()).filter((b) => b.supplierId === supplierId);
}

export async function getBidsByTender(tenderId: string): Promise<SupplierBid[]> {
  return (await getBids()).filter((b) => b.tenderId === tenderId);
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
  const year = new Date().getFullYear();
  const nums = (await getBids())
    .map((b) => b.bidCode ?? "")
    .filter((c) => c.startsWith(`BG-${year}-`))
    .map((c) => parseInt(c.slice(-3), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `BG-${year}-${String(next).padStart(3, "0")}`;
}

export function generateBidId(): string {
  return `BID-${Date.now()}`;
}

export async function deleteBid(id: string): Promise<void> {
  await apiDelete<boolean>(`/api/bids/${encodeURIComponent(id)}`);
}
