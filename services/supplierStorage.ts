import type { Supplier } from "@/types/supplier";

const STORAGE_KEY = "procurehub_suppliers";

export function getSuppliers(): Supplier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Supplier[]) : [];
  } catch {
    return [];
  }
}

export function saveSupplier(supplier: Supplier): void {
  const existing = getSuppliers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, supplier]));
}

export function isTaxCodeExists(taxCode: string): boolean {
  const normalized = taxCode.trim().replace(/\s/g, "");
  return getSuppliers().some(
    (s) => s.taxCode.trim().replace(/\s/g, "") === normalized
  );
}
