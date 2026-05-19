import { fail, forbidden, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import {
  createNotificationDedupedSafe,
  markReadByTypesSafe,
  notifyInternalByRolesDedupedSafe,
} from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { deleteSupplierRecord, getSupplier, upsertSupplier } from "@/lib/repositories/procurehub";
import {
  emailSupplierApproved,
  emailSupplierDeactivated,
  emailSupplierNeedMoreInfo,
  emailSupplierRejected,
} from "@/lib/email/service";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { ActivityAction } from "@/types/activityLog";
import { getServerSession } from "@/lib/auth/server";
import { hasPermissionDB } from "@/lib/auth/rbac-server";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

function resolveSupplierAction(previous: SupplierAccount | null, current: SupplierAccount): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    if (current.status === "Đã duyệt") return previous.status === "Tạm khóa" ? "activated" : "approved";
    if (current.status === "Từ chối") return "rejected";
    if (current.status === "Tạm khóa") return "deactivated";
  }
  return "updated";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const { id } = await params;
    // Supplier chỉ xem được record của chính mình
    if (session.kind === "supplier" && session.sub !== id) return forbidden();
    // Internal phải có suppliers:read
    if (session.kind === "internal" && !(await hasPermissionDB(session.role, "suppliers:read")))
      return forbidden(`Vai trò "${session.role}" không có quyền xem nhà cung cấp`);
    return ok(await getSupplier(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const supplier = (await request.json()) as SupplierAccount;
    const previous = await getSupplier(id);

    // ── RBAC ─────────────────────────────────────────────────────────────────
    if (session.kind === "supplier") {
      // Supplier chỉ cập nhật được profile của chính mình
      if (session.sub !== id) return forbidden("Không có quyền cập nhật hồ sơ nhà cung cấp khác");
      // Supplier không được tự thay đổi status
      if (previous && supplier.status !== previous.status)
        return forbidden("Không có quyền thay đổi trạng thái tài khoản");
    } else {
      // Internal user — kiểm tra permission
      const isStatusChange = previous && supplier.status !== previous.status;
      if (isStatusChange && !(await hasPermissionDB(session.role, "suppliers:approve")))
        return forbidden(`Vai trò "${session.role}" không có quyền thay đổi trạng thái nhà cung cấp`);
      if (!isStatusChange && !(await hasPermissionDB(session.role, "suppliers:write")))
        return forbidden(`Vai trò "${session.role}" không có quyền chỉnh sửa nhà cung cấp`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const saved = await upsertSupplier({ ...supplier, id });
    const action = resolveSupplierAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "supplier",
      entityId: saved.id,
      entityName: saved.companyName,
      action,
      description: describeActivity("supplier", action, saved.companyName),
      metadata: {
        taxCode: saved.taxCode,
        email: saved.email,
        phone: saved.phone,
        status: saved.status,
      },
      oldValues: snapshot(previous),
      newValues: snapshot(saved),
    });
    const callerKind = session.kind;

    // Thông báo cho supplier khi admin đổi status
    // Xoá thông báo cũ đã lỗi thời trước khi tạo thông báo mới (tránh trùng lặp)
    const statusChanged = previous?.status !== saved.status;
    if (statusChanged) {
      if (saved.status === "Đã duyệt") {
        await markReadByTypesSafe(saved.id, "supplier", [
          NotificationType.SUPPLIER_NEED_MORE_INFO,
          NotificationType.SUPPLIER_REJECTED,
          NotificationType.SUPPLIER_DEACTIVATED,
        ]);
        await createNotificationDedupedSafe({
          userId: saved.id, userKind: "supplier",
          type: NotificationType.SUPPLIER_APPROVED,
          title: "Hồ sơ được duyệt",
          message: "Hồ sơ nhà cung cấp của bạn đã được xét duyệt thành công. Bạn có thể tham gia đấu thầu ngay.",
          link: "/supplier/dashboard",
        });
        void emailSupplierApproved(saved.email, saved.companyName);
      } else if (saved.status === "Từ chối") {
        await markReadByTypesSafe(saved.id, "supplier", [
          NotificationType.SUPPLIER_APPROVED,
          NotificationType.SUPPLIER_NEED_MORE_INFO,
        ]);
        await createNotificationDedupedSafe({
          userId: saved.id, userKind: "supplier",
          type: NotificationType.SUPPLIER_REJECTED,
          title: "Hồ sơ bị từ chối",
          message: "Hồ sơ nhà cung cấp của bạn chưa được phê duyệt. Vui lòng liên hệ phòng mua sắm để biết thêm chi tiết.",
          link: "/supplier/profile",
        });
        void emailSupplierRejected(saved.email, saved.companyName);
      } else if (saved.status === "Tạm khóa") {
        await markReadByTypesSafe(saved.id, "supplier", [
          NotificationType.SUPPLIER_APPROVED,
          NotificationType.SUPPLIER_NEED_MORE_INFO,
        ]);
        await createNotificationDedupedSafe({
          userId: saved.id, userKind: "supplier",
          type: NotificationType.SUPPLIER_DEACTIVATED,
          title: "Tài khoản nhà cung cấp bị tạm khóa",
          message: "Tài khoản nhà cung cấp của bạn đang bị tạm khóa. Vui lòng liên hệ bộ phận phụ trách.",
          link: "/supplier/dashboard",
        });
        void emailSupplierDeactivated(saved.email, saved.companyName);
      } else if (saved.status === "Yêu cầu bổ sung") {
        await markReadByTypesSafe(saved.id, "supplier", [
          NotificationType.SUPPLIER_APPROVED,
        ]);
        await createNotificationDedupedSafe({
          userId: saved.id, userKind: "supplier",
          type: NotificationType.SUPPLIER_NEED_MORE_INFO,
          title: "Cần bổ sung hồ sơ",
          message: "Phòng mua sắm yêu cầu bổ sung thông tin trước khi phê duyệt. Vui lòng cập nhật hồ sơ nhà cung cấp.",
          link: "/supplier/profile",
        });
        void emailSupplierNeedMoreInfo(saved.email, saved.companyName);
      }
    }

    // Thông báo cho admin khi supplier tự cập nhật hồ sơ (dedup theo type+link để không spam)
    if (callerKind === "supplier") {
      await notifyInternalByRolesDedupedSafe(PROCUREMENT_ROLES, {
        type: NotificationType.SYSTEM_ALERT,
        title: "Nhà cung cấp cập nhật hồ sơ",
        message: `${saved.companyName} đã cập nhật hồ sơ nhà cung cấp. Vui lòng kiểm tra thông tin mới nhất.`,
        link: `/admin/suppliers/${saved.id}`,
        metadata: { supplierId: saved.id, supplierName: saved.companyName },
      }, { matchLink: true });
    }

    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    if (!(await hasPermissionDB(session.role, "suppliers:delete")))
      return forbidden(`Vai trò "${session.role}" không có quyền xóa tài khoản nhà cung cấp`);
    const { id } = await params;
    const previous = await getSupplier(id);
    if (!previous) return fail(new Error("Không tìm thấy nhà cung cấp"), 404);
    await deleteSupplierRecord(id);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "supplier",
      entityId: previous.id,
      entityName: previous.companyName,
      action: "deleted",
      description: `Xóa tài khoản nhà cung cấp ${previous.companyName}`,
      metadata: { taxCode: previous.taxCode, email: previous.email },
      oldValues: snapshot(previous),
      newValues: null,
    });
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
