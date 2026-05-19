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
  | "suppliers:delete"
  | "bids:read"
  | "bids:evaluate"
  | "users:manage"
  | "reports:read"
  | "admin:full";

// ── UI metadata ───────────────────────────────────────────────────────────────

export interface PermissionMeta {
  label: string;
  description: string;
  group: string;
}

export const PERMISSION_META: Record<Permission, PermissionMeta> = {
  "tenders:read":     { group: "Gói thầu",     label: "Xem gói thầu",              description: "Xem danh sách và chi tiết gói thầu" },
  "tenders:write":    { group: "Gói thầu",     label: "Tạo & sửa gói thầu",        description: "Tạo mới, chỉnh sửa thông tin gói thầu" },
  "tenders:publish":  { group: "Gói thầu",     label: "Mở / Đóng gói thầu",        description: "Chuyển trạng thái mở thầu, đóng thầu, đánh giá" },
  "tenders:delete":   { group: "Gói thầu",     label: "Xóa gói thầu",              description: "Xóa vĩnh viễn gói thầu ở trạng thái Nháp" },
  "suppliers:read":   { group: "Nhà cung cấp", label: "Xem nhà cung cấp",          description: "Xem danh sách và hồ sơ nhà cung cấp" },
  "suppliers:write":  { group: "Nhà cung cấp", label: "Sửa hồ sơ NCC",             description: "Chỉnh sửa thông tin hồ sơ nhà cung cấp" },
  "suppliers:approve":{ group: "Nhà cung cấp", label: "Duyệt / Từ chối NCC",       description: "Phê duyệt, từ chối hoặc yêu cầu bổ sung hồ sơ" },
  "suppliers:delete": { group: "Nhà cung cấp", label: "Xóa tài khoản NCC",         description: "Xóa vĩnh viễn tài khoản nhà cung cấp" },
  "bids:read":        { group: "Báo giá",       label: "Xem báo giá",               description: "Xem danh sách và chi tiết báo giá" },
  "bids:evaluate":    { group: "Báo giá",       label: "Đánh giá & chốt thầu",      description: "So sánh, đề xuất và chốt kết quả chọn thầu" },
  "users:manage":     { group: "Hệ thống",      label: "Quản lý người dùng nội bộ", description: "Tạo, sửa, khóa tài khoản và phân vai trò" },
  "reports:read":     { group: "Hệ thống",      label: "Xem báo cáo & xuất file",   description: "Xem dashboard, xuất Excel và báo cáo HTML" },
  "admin:full":       { group: "Hệ thống",      label: "Toàn quyền Admin",          description: "Bao gồm tất cả quyền, không thể tắt" },
};

export const ALL_PERMISSIONS: Permission[] = [
  "tenders:read", "tenders:write", "tenders:publish", "tenders:delete",
  "suppliers:read", "suppliers:write", "suppliers:approve", "suppliers:delete",
  "bids:read", "bids:evaluate",
  "users:manage", "reports:read", "admin:full",
];

export const PERMISSION_GROUPS = ["Gói thầu", "Nhà cung cấp", "Báo giá", "Hệ thống"] as const;

// Roles that can be managed via the permissions UI (supplier is handled separately)
export const MANAGEABLE_ROLES: InternalRole[] = [
  "Admin",
  "Trưởng phòng vật tư",
  "Kế hoạch vật tư",
  "Ban giám đốc",
  "Chỉ xem",
];

// ── Hardcoded fallback (source of truth when DB unavailable) ──────────────────

const ROLE_PERMISSIONS_FALLBACK: Record<string, Permission[]> = {
  Admin: [
    "admin:full",
    "tenders:read", "tenders:write", "tenders:publish", "tenders:delete",
    "suppliers:read", "suppliers:write", "suppliers:approve", "suppliers:delete",
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
  return ROLE_PERMISSIONS_FALLBACK[role] ?? [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = getPermissions(role);
  return perms.includes("admin:full") || perms.includes(permission);
}
