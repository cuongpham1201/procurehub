import {
  DEMO_INTERNAL_USERS,
  DEMO_SUPPLIER_ACCOUNTS,
  DEMO_SUPPLIER_BIDS,
  DEMO_SUPPLIERS,
  DEMO_TENDERS,
} from "@/data/demoData";

export const DEMO_STORAGE_KEYS = {
  adminTenders: "procurehub_admin_tenders",
  supplierAccounts: "procurehub_supplier_accounts",
  supplierProfiles: "procurehub_supplier_profiles",
  legacySuppliers: "procurehub_suppliers",
  supplierBids: "procurehub_supplier_bids",
  adminUsers: "procurehub_admin_users",
  adminActivityLogs: "procurehub_admin_activity_logs",
  currentSupplier: "procurehub_current_supplier",
} as const;

const CORE_DATA_KEYS = [
  DEMO_STORAGE_KEYS.adminTenders,
  DEMO_STORAGE_KEYS.supplierAccounts,
  DEMO_STORAGE_KEYS.legacySuppliers,
  DEMO_STORAGE_KEYS.supplierBids,
  DEMO_STORAGE_KEYS.adminUsers,
];

const RESET_KEYS = [
  ...CORE_DATA_KEYS,
  DEMO_STORAGE_KEYS.supplierProfiles,
  DEMO_STORAGE_KEYS.adminActivityLogs,
  DEMO_STORAGE_KEYS.currentSupplier,
];

function hasArrayData(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function hasAnyProcureHubData(): boolean {
  return CORE_DATA_KEYS.some(hasArrayData);
}

export function initDemoDataIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (hasAnyProcureHubData()) return;

  writeJson(DEMO_STORAGE_KEYS.adminTenders, DEMO_TENDERS);
  writeJson(DEMO_STORAGE_KEYS.supplierAccounts, DEMO_SUPPLIER_ACCOUNTS);
  writeJson(DEMO_STORAGE_KEYS.supplierProfiles, DEMO_SUPPLIER_ACCOUNTS);
  writeJson(DEMO_STORAGE_KEYS.legacySuppliers, DEMO_SUPPLIERS);
  writeJson(DEMO_STORAGE_KEYS.supplierBids, DEMO_SUPPLIER_BIDS);
  writeJson(DEMO_STORAGE_KEYS.adminUsers, DEMO_INTERNAL_USERS);
}

export function resetDemoData(): void {
  if (typeof window === "undefined") return;

  RESET_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  initDemoDataIfEmpty();
}
