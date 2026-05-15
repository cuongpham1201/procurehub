import { fail, ok } from "@/lib/api";
import {
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
import { getSupplier, upsertSupplier } from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { ActivityAction } from "@/types/activityLog";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

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
    const { id } = await params;
    return ok(await getSupplier(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = (await request.json()) as SupplierAccount;
    const previous = await getSupplier(id);
    const saved = await upsertSupplier({ ...supplier, id });
    const action = resolveSupplierAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), {
        actorId: saved.id,
        actorType: "supplier",
        actorName: saved.companyName,
        actorEmail: saved.email,
      }),
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
    // Xác định caller là supplier hay internal để phân biệt luồng thông báo
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const callerSession = token ? await verifySession(token) : null;
    const callerKind = callerSession?.kind ?? "internal";

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
