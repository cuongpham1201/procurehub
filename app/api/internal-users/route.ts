import { fail, forbidden, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { hasPermissionDB } from "@/lib/auth/rbac-server";
import { getInternalUser, listInternalUsers, upsertInternalUser } from "@/lib/repositories/procurehub";
import type { InternalUser } from "@/types/internalUser";
import type { ActivityAction } from "@/types/activityLog";

export const dynamic = "force-dynamic";

function resolveUserAction(previous: InternalUser | null, current: InternalUser): ActivityAction {
  if (!previous) return "created";
  if (previous.role !== current.role) return "role_changed";
  if (previous.status !== current.status && current.status === "Tạm khóa") return "deactivated";
  return "updated";
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    if (!(await hasPermissionDB(session.role, "users:manage")))
      return forbidden(`Vai trò "${session.role}" không có quyền xem người dùng nội bộ`);
    return ok(await listInternalUsers());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    if (!(await hasPermissionDB(session.role, "users:manage")))
      return forbidden(`Vai trò "${session.role}" không có quyền quản lý người dùng nội bộ`);
    const user = (await request.json()) as InternalUser;
    const previous = user.id ? await getInternalUser(user.id) : null;
    const saved = await upsertInternalUser(user);
    const action = resolveUserAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "user",
      entityId: saved.id,
      entityName: saved.fullName,
      action,
      description: describeActivity("user", action, saved.fullName),
      metadata: {
        email: saved.email,
        role: saved.role,
        department: saved.department,
        status: saved.status,
      },
      oldValues: snapshot(previous ? { ...previous, password: undefined } : null),
      newValues: snapshot({ ...saved, password: undefined }),
    });
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
