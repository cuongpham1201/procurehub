// Server-only — never import this from client components
// Contains DB-backed permission lookup with in-memory cache

import { getAllRolePermissions } from "@/lib/repositories/procurehub";
import { getPermissions, type Permission } from "@/lib/auth/rbac";

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
      _cache = map as Record<string, Permission[]>;
      _cacheAt = now;
    } catch {
      return getPermissions(role);
    }
  }
  const perms = _cache[role];
  if (!perms) return getPermissions(role);
  return perms;
}

export async function hasPermissionDB(role: string, permission: Permission): Promise<boolean> {
  const perms = await getPermissionsDB(role);
  return perms.includes("admin:full") || perms.includes(permission);
}
