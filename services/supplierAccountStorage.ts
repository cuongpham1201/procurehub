import type { SupplierAccount } from "@/types/supplierAccount";
import { initDemoDataIfEmpty } from "@/services/demoDataStorage";

const ACCOUNTS_KEY = "procurehub_supplier_accounts";
const SESSION_KEY = "procurehub_current_supplier";
const PROFILES_KEY = "procurehub_supplier_profiles";
const LEGACY_SUPPLIERS_KEY = "procurehub_suppliers";

function readStoredArrayLength(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function getAccounts(): SupplierAccount[] {
  if (typeof window === "undefined") return [];
  initDemoDataIfEmpty();
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as SupplierAccount[]) : [];
  } catch {
    return [];
  }
}

export function getRegisteredSupplierCount(): number {
  const profileCount = readStoredArrayLength(PROFILES_KEY);
  if (profileCount > 0) return profileCount;
  const accountCount = getAccounts().length;
  if (accountCount > 0) return accountCount;
  return readStoredArrayLength(LEGACY_SUPPLIERS_KEY);
}

export function saveAccount(account: SupplierAccount): void {
  const existing = getAccounts();
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...existing, account]));
}

export function updateAccount(updated: SupplierAccount): void {
  const accounts = getAccounts().map((a) =>
    a.id === updated.id ? updated : a
  );
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function isEmailExists(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return getAccounts().some((a) => a.email.trim().toLowerCase() === normalized);
}

export function isTaxCodeExists(taxCode: string): boolean {
  const normalized = taxCode.trim().replace(/\s/g, "");
  if (!normalized) return false;
  return getAccounts().some(
    (a) => a.taxCode.trim().replace(/\s/g, "").toLowerCase() === normalized.toLowerCase()
  );
}

export function normalizePhone(phone: string): string {
  // Xóa khoảng trắng, dấu chấm, dấu gạch ngang
  let p = phone.replace(/[\s.\-]/g, "");
  // +84... → 0...
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  // 84... (11 chữ số) → 0...
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

export function isPhoneExists(phone: string): boolean {
  const normalized = normalizePhone(phone.trim());
  if (!normalized) return false;
  return getAccounts().some(
    (a) => normalizePhone(a.phone.trim()) === normalized
  );
}

export function findByCredentials(
  email: string,
  password: string
): SupplierAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    getAccounts().find(
      (a) => a.email.trim().toLowerCase() === normalized && a.password === password
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
