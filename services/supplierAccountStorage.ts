import { apiGet, apiPost, apiPut } from "@/services/apiClient";
import type { SupplierAccount } from "@/types/supplierAccount";

const SESSION_KEY = "procurehub_current_supplier";

export async function getAccounts(): Promise<SupplierAccount[]> {
  try {
    return await apiGet<SupplierAccount[]>("/api/suppliers");
  } catch {
    return [];
  }
}

export async function getRegisteredSupplierCount(): Promise<number> {
  return (await getAccounts()).length;
}

export async function saveAccount(account: SupplierAccount): Promise<void> {
  await apiPost<SupplierAccount>("/api/suppliers", account);
}

export async function updateAccount(updated: SupplierAccount): Promise<void> {
  await apiPut<SupplierAccount>(`/api/suppliers/${encodeURIComponent(updated.id)}`, updated);
}

export async function isEmailExists(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  return (await getAccounts()).some((a) => a.email.trim().toLowerCase() === normalized);
}

export async function isTaxCodeExists(taxCode: string): Promise<boolean> {
  const normalized = taxCode.trim().replace(/\s/g, "");
  if (!normalized) return false;
  return (await getAccounts()).some(
    (a) => a.taxCode.trim().replace(/\s/g, "").toLowerCase() === normalized.toLowerCase(),
  );
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s.\-]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

export async function isPhoneExists(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone.trim());
  if (!normalized) return false;
  return (await getAccounts()).some((a) => normalizePhone(a.phone.trim()) === normalized);
}

export async function findByCredentials(
  email: string,
  password: string,
): Promise<SupplierAccount | null> {
  const normalized = email.trim().toLowerCase();
  return (
    (await getAccounts()).find(
      (a) => a.email.trim().toLowerCase() === normalized && a.password === password,
    ) ?? null
  );
}

export function getCurrentSession(): SupplierAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupplierAccount) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(account: SupplierAccount): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(account));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
