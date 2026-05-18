// Server-only — never import this from client components
// Contains DB-backed permission lookup with in-memory cache

import { getAllRolePermissions } from "@/lib/repositories/procurehub";
import { getPermissions, MANAGEABLE_ROLES, type Permission } from "@/lib/auth/rbac";

let _cache: Record<string, Permission[]> | null = null;
let _cacheAt = 0;
const CACHE_TTL = 60_000; // 1 minute

export function invalidatePermissionsCache(): void {
  _cache = null;
  _cacheAt = 0;
}

export async function getPermissionsDB(role: string): Promise<Permission[]> {
  const now = Date.now();
  if (!_cache || now - _cacheAt > CACHE_TTL) {
    try {
      const map = await getAllRolePermissions();
      // Pre-seed all known roles with [] so a role with 0 DB permissions
      // returns [] instead of falling through to the hardcoded fallback.
      const base = Object.fromEntries(MANAGEABLE_ROLES.map((r) => [r, [] as Permission[]]));
      _cache = { ...base, ...map } as Record<string, Permission[]>;
      _cacheAt = now;
    } catch {
      return getPermissions(role);
    }
  }
  // Known roles (including those with 0 permissions) are in _cache.
  // Fall back to hardcoded only for truly unknown roles not in MANAGEABLE_ROLES.
  return _cache[role] ?? getPermissions(role);
}

export async function hasPermissionDB(role: string, permission: Permission): Promise<boolean> {
  const perms = await getPermissionsDB(role);
  return perms.includes("admin:full") || perms.includes(permission);
}
