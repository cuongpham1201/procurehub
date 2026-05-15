export type InternalRole =
  | "Admin"
  | "Trưởng phòng vật tư"
  | "Kế hoạch vật tư"
  | "Ban giám đốc"
  | "Chỉ xem";

export type UserKind = "internal" | "supplier";

export type Permission =
  | "tenders:read"
  | "tenders:write"
  | "tenders:publish"
  | "tenders:delete"
  | "suppliers:read"
  | "suppliers:write"
  | "suppliers:approve"
  | "bids:read"
  | "bids:evaluate"
  | "users:manage"
  | "reports:read"
  | "admin:full";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Admin: [
    "admin:full",
    "tenders:read", "tenders:write", "tenders:publish", "tenders:delete",
    "suppliers:read", "suppliers:write", "suppliers:approve",
    "bids:read", "bids:evaluate",
    "users:manage",
    "reports:read",
  ],
  "Trưởng phòng vật tư": [
    "tenders:read", "tenders:write", "tenders:publish",
    "suppliers:read", "suppliers:write", "suppliers:approve",
    "bids:read", "bids:evaluate",
    "reports:read",
  ],
  "Kế hoạch vật tư": [
    "tenders:read", "tenders:write",
    "suppliers:read",
    "bids:read",
    "reports:read",
  ],
  "Ban giám đốc": [
    "tenders:read", "tenders:publish",
    "suppliers:read", "suppliers:approve",
    "bids:read", "bids:evaluate",
    "reports:read",
  ],
  "Chỉ xem": [
    "tenders:read",
    "suppliers:read",
    "bids:read",
    "reports:read",
  ],
  supplier: [],
};

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = getPermissions(role);
  return perms.includes("admin:full") || perms.includes(permission);
}
