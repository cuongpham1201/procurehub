import { apiGet, apiPost } from "@/services/apiClient";
import type { InternalUser } from "@/types/internalUser";

const INTERNAL_SESSION_KEY = "procurehub_current_internal_user";
const SUPPLIER_SESSION_KEY = "procurehub_current_supplier";

export const MOCK_ADMIN: InternalUser = {
  id: "internal-admin-001",
  fullName: "Admin hệ thống",
  email: "admin@biahalong.vn",
  password: "admin123",
  role: "Admin",
  department: "Quản trị hệ thống",
  status: "Hoạt động",
  createdAt: "2025-01-01T00:00:00.000Z",
};

export async function getAdminUsers(): Promise<InternalUser[]> {
  try {
    return await apiGet<InternalUser[]>("/api/internal-users");
  } catch {
    return [];
  }
}

export async function saveAdminUser(user: InternalUser): Promise<void> {
  await apiPost<InternalUser>("/api/internal-users", user);
}

export function generateUserId(): string {
  return `user-${Date.now()}`;
}

export async function findInternalByCredentials(
  email: string,
  password: string,
): Promise<InternalUser | null> {
  const normalized = email.trim().toLowerCase();
  const found = (await getAdminUsers()).find(
    (u) => u.email.trim().toLowerCase() === normalized && u.password === password,
  );
  if (found) return found;
  if (normalized === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    return { ...MOCK_ADMIN, password: "" };
  }
  return null;
}

export function getInternalSession(): InternalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INTERNAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as InternalUser) : null;
  } catch {
    return null;
  }
}

export function setInternalSession(user: InternalUser): void {
  const { password: _pw, ...safe } = user;
  localStorage.setItem(INTERNAL_SESSION_KEY, JSON.stringify({ ...safe, password: "" }));
}

export function clearInternalSession(): void {
  localStorage.removeItem(INTERNAL_SESSION_KEY);
}

export function clearAllSessions(): void {
  localStorage.removeItem(INTERNAL_SESSION_KEY);
  localStorage.removeItem(SUPPLIER_SESSION_KEY);
}
