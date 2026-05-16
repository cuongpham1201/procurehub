import { saveAccount, getAccounts } from "@/services/supplierAccountStorage";
import type { Supplier } from "@/types/supplier";

export async function getSuppliers(): Promise<Supplier[]> {
  const accounts = await getAccounts();
  return accounts.map((account) => ({
    id: account.id,
    companyName: account.companyName,
    taxCode: account.taxCode,
    address: account.address ?? "",
    province: account.province ?? "",
    website: account.website ?? "",
    businessField: account.businessDescription ?? "",
    contactName: account.contactName,
    contactPosition: "Đầu mối báo giá",
    contactEmail: account.email,
    contactPhone: account.phone,
    categories: account.categories ?? [],
    attachments: [],
    status: account.status,
    createdAt: account.createdAt,
  }));
}

export async function saveSupplier(supplier: Supplier): Promise<void> {
  await saveAccount({
    id: supplier.id,
    companyName: supplier.companyName,
    taxCode: supplier.taxCode,
    contactName: supplier.contactName,
    email: supplier.contactEmail,
    phone: supplier.contactPhone,
    password: "123456",
    profileCompleted: true,
    status: supplier.status,
    createdAt: supplier.createdAt,
    address: supplier.address,
    province: supplier.province,
    website: supplier.website,
    businessDescription: supplier.businessField,
    categories: supplier.categories,
  });
}

export async function isTaxCodeExists(taxCode: string, excludeId?: string): Promise<boolean> {
  const { isTaxCodeExists: check } = await import("@/services/supplierAccountStorage");
  return check(taxCode, excludeId);
}
