import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { ALL_PERMISSIONS, MANAGEABLE_ROLES } from "@/lib/auth/rbac";
import { invalidatePermissionsCache } from "@/lib/auth/rbac-server";
import { getAllRolePermissions, setRolePermissions } from "@/lib/repositories/procurehub";
import { unauthorized, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/admin/role-permissions
// Returns the full permission matrix: { [role]: Permission[] }
export async function GET() {
  const session = await getServerSession();
  if (!session || session.kind !== "internal" || session.role !== "Admin") {
    return unauthorized("Chỉ Admin mới có quyền quản lý phân quyền");
  }

  const matrix = await getAllRolePermissions();
  return NextResponse.json({ matrix });
}

// PUT /api/admin/role-permissions
// Body: { role: string; permissions: string[] }
// Replaces all permissions for the given role, then invalidates cache
export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.kind !== "internal" || session.role !== "Admin") {
    return unauthorized("Chỉ Admin mới có quyền quản lý phân quyền");
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.role !== "string") return badRequest("Thiếu trường role");

  const role = body.role as string;
  const permissions: string[] = Array.isArray(body.permissions) ? body.permissions : [];

  if (!MANAGEABLE_ROLES.includes(role as never)) {
    return badRequest(`Role không hợp lệ: ${role}`);
  }

  // Admin role must always keep admin:full
  const sanitized = role === "Admin"
    ? [...new Set(["admin:full", ...permissions.filter((p) => ALL_PERMISSIONS.includes(p as never))])]
    : permissions.filter((p) => ALL_PERMISSIONS.includes(p as never));

  await setRolePermissions(role, sanitized);
  invalidatePermissionsCache();

  return NextResponse.json({ ok: true, role, permissions: sanitized });
}
