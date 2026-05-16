import { apiGet, apiPost, apiPut } from "@/services/apiClient";
import type { SupplierAccount } from "@/types/supplierAccount";

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

async function checkDuplicates(params: {
  email?: string;
  taxCode?: string;
  phone?: string;
  excludeId?: string;
}): Promise<{ emailExists: boolean; taxCodeExists: boolean; phoneExists: boolean }> {
  const qs = new URLSearchParams();
  if (params.email)     qs.set("email",     params.email);
  if (params.taxCode)   qs.set("taxCode",   params.taxCode);
  if (params.phone)     qs.set("phone",     params.phone);
  if (params.excludeId) qs.set("excludeId", params.excludeId);
  try {
    return await apiGet<{ emailExists: boolean; taxCodeExists: boolean; phoneExists: boolean }>(
      `/api/suppliers/check?${qs.toString()}`
    );
  } catch {
    // Nếu không kết nối được, bỏ qua check (không block đăng ký)
    return { emailExists: false, taxCodeExists: false, phoneExists: false };
  }
}

export async function isEmailExists(email: string, excludeId?: string): Promise<boolean> {
  if (!email.trim()) return false;
  const { emailExists } = await checkDuplicates({ email: email.trim(), excludeId });
  return emailExists;
}

export async function isTaxCodeExists(taxCode: string, excludeId?: string): Promise<boolean> {
  if (!taxCode.trim()) return false;
  const { taxCodeExists } = await checkDuplicates({ taxCode: taxCode.trim(), excludeId });
  return taxCodeExists;
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s.\-]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

export async function isPhoneExists(phone: string, excludeId?: string): Promise<boolean> {
  const normalized = normalizePhone(phone.trim());
  if (!normalized) return false;
  const { phoneExists } = await checkDuplicates({ phone: normalized, excludeId });
  return phoneExists;
}

// Session management is now handled by JWT cookie (ph_auth).
// Use useCurrentUser() hook in client components to get the current supplier session.
// Authentication is handled by POST /api/auth/login — see app/api/auth/login/route.ts
