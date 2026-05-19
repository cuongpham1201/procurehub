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
import {
  deleteInternalUserRecord,
  getInternalUser,
} from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    if (!(await hasPermissionDB(session.role, "users:manage")))
      return forbidden(`Vai trò "${session.role}" không có quyền xóa người dùng nội bộ`);

    // Không cho phép tự xóa chính mình
    if (id === session.sub)
      return fail(new Error("Không thể xóa tài khoản đang đăng nhập"), 400);

    const previous = await getInternalUser(id);
    if (!previous) return fail(new Error("Không tìm thấy người dùng"), 404);

    await deleteInternalUserRecord(id);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "user",
      entityId: previous.id,
      entityName: previous.fullName,
      action: "deleted",
      description: `Xóa tài khoản nội bộ ${previous.fullName}`,
      metadata: { email: previous.email, role: previous.role },
      oldValues: snapshot({ ...previous, password: undefined }),
      newValues: null,
    });
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
