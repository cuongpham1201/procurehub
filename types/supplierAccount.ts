export interface SupplierAccount {
  id: string;
  companyName: string;
  taxCode: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  password_hash?: string;
  profileCompleted: boolean;
  status: string;
  createdAt: string;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
  // Profile fields — populated when supplier completes profile
  address?: string;
  province?: string;
  website?: string;
  businessDescription?: string;
  categories?: string[];
  hotline?: string;
  rfqEmail?: string;
  quotationContact?: string;
}
