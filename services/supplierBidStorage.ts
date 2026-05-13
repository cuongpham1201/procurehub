import type { SupplierBid, BidStatus } from "@/types/supplierBid";

const BIDS_KEY = "procurehub_supplier_bids";

export function getBids(): SupplierBid[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BIDS_KEY);
    return raw ? (JSON.parse(raw) as SupplierBid[]) : [];
  } catch {
    return [];
  }
}

export function saveBid(bid: SupplierBid): void {
  const existing = getBids();
  localStorage.setItem(BIDS_KEY, JSON.stringify([...existing, bid]));
}

export function getBidById(id: string): SupplierBid | undefined {
  return getBids().find((b) => b.id === id);
}

export function getBidsBySupplier(supplierId: string): SupplierBid[] {
  return getBids().filter((b) => b.supplierId === supplierId);
}

export function getBidsByTender(tenderId: string): SupplierBid[] {
  return getBids().filter((b) => b.tenderId === tenderId);
}

export function updateBidStatus(id: string, status: BidStatus): void {
  const bids = getBids().map((b) => (b.id === id ? { ...b, status } : b));
  localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
}

export function markBidAsWinner(winningBidId: string, tenderId: string): void {
  const bids = getBids().map((b): SupplierBid => {
    if (b.tenderId !== tenderId) return b;
    const status: BidStatus = b.id === winningBidId ? "Được chọn" : "Không được chọn";
    return { ...b, status };
  });
  localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
}

export function generateBidCode(): string {
  const year = new Date().getFullYear();
  const existing = getBids();
  const nums = existing
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

export function deleteBid(id: string): void {
  const bids = getBids().filter((b) => b.id !== id);
  localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
}
