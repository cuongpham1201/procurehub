import type { InternalUser } from "@/types/internalUser";

const INTERNAL_SESSION_KEY = "procurehub_current_internal_user";
const ADMIN_USERS_KEY = "procurehub_admin_users";
const SUPPLIER_SESSION_KEY = "procurehub_current_supplier";

// ── Mock fallback admin ───────────────────────────────────────────────────

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

// ── Internal users (localStorage) ────────────────────────────────────────

export function getAdminUsers(): InternalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    return raw ? (JSON.parse(raw) as InternalUser[]) : [];
  } catch {
    return [];
  }
}

export function saveAdminUser(user: InternalUser): void {
  const existing = getAdminUsers();
  const idx = existing.findIndex((u) => u.id === user.id);
  if (idx >= 0) existing[idx] = user;
  else existing.push(user);
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(existing));
}

export function generateUserId(): string {
  return `user-${Date.now()}`;
}

export function findInternalByCredentials(
  email: string,
  password: string
): InternalUser | null {
  const normalized = email.trim().toLowerCase();
  const users = getAdminUsers();
  const found = users.find(
    (u) => u.email.trim().toLowerCase() === normalized && u.password === password
  );
  if (found) return found;
  if (normalized === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    return { ...MOCK_ADMIN, password: "" };
  }
  return null;
}

// ── Internal session ──────────────────────────────────────────────────────

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

// ── Clear all sessions (global logout) ───────────────────────────────────

export function clearAllSessions(): void {
  localStorage.removeItem(INTERNAL_SESSION_KEY);
  localStorage.removeItem(SUPPLIER_SESSION_KEY);
}
