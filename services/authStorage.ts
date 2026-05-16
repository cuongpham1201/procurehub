import { apiGet, apiPost } from "@/services/apiClient";
import type { InternalUser } from "@/types/internalUser";

export const INTERNAL_DEFAULT_PASSWORD = "123456";

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
  const users = await getAdminUsers();
  const found = users.find(
    (u) => u.email.trim().toLowerCase() === normalized && u.password === password,
  );
  if (found) return found;
  const hasPersistedAdmin = users.some(
    (u) => u.email.trim().toLowerCase() === MOCK_ADMIN.email,
  );
  if (!hasPersistedAdmin && normalized === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    return { ...MOCK_ADMIN, password: "" };
  }
  return null;
}

export async function resetAllInternalPasswords(
  nextPassword: string = INTERNAL_DEFAULT_PASSWORD,
): Promise<number> {
  const users = await getAdminUsers();
  const hasPersistedAdmin = users.some(
    (u) => u.email.trim().toLowerCase() === MOCK_ADMIN.email,
  );
  const targets = hasPersistedAdmin
    ? users
    : [
        {
          ...MOCK_ADMIN,
          password: nextPassword,
        },
        ...users,
      ];

  await Promise.all(
    targets.map((user) =>
      saveAdminUser({
        ...user,
        password: nextPassword,
      }),
    ),
  );

  return targets.length;
}

export async function resetInternalPassword(
  user: InternalUser,
  nextPassword: string = INTERNAL_DEFAULT_PASSWORD,
): Promise<void> {
  await saveAdminUser({
    ...user,
    password: nextPassword,
  });
}

// Session management is now handled by JWT cookie (ph_auth).
// Use useCurrentUser() hook in client components, or getServerSession() in API routes.
