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
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { getActiveSupplierEmails, listTenders, upsertTender } from "@/lib/repositories/procurehub";
import { emailTenderPublishedSuppliers } from "@/lib/email/service";
import type { AdminTender } from "@/types/adminTender";
import type { ActivityAction } from "@/types/activityLog";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

function resolveTenderAction(previous: AdminTender | null, current: AdminTender): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    if (current.status === "Đang nhận báo giá") return "published";
    if (current.status === "Đã hủy") return "cancelled";
    if (current.status === "Đã đóng") return "closed";
    if (current.status === "Đã có kết quả") return "awarded";
  }
  return "updated";
}

export async function GET() {
  try {
    const session = await getServerSession();
    const tenders = await listTenders();

    // Non-internal: chỉ thấy tenders đang mở
    if (!session || session.kind !== "internal") {
      return ok(tenders.filter((t) => t.status !== "Nháp" && t.status !== "Đã hủy" && t.status !== "Chờ phê duyệt"));
    }

    // Internal: phải có tenders:read để thấy full list (bao gồm Nháp)
    if (!(await hasPermissionDB(session.role, "tenders:read")))
      return forbidden(`Vai trò "${session.role}" không có quyền xem gói thầu`);

    return ok(tenders);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    if (!(await hasPermissionDB(session.role, "tenders:write")))
      return forbidden(`Vai trò "${session.role}" không có quyền tạo gói thầu`);
    const tender = (await request.json()) as AdminTender;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!tender.title?.trim())
      return fail(new Error("Tên gói thầu không được để trống"), 400);
    if (!tender.category?.trim())
      return fail(new Error("Danh mục không được để trống"), 400);
    if (!tender.deadline?.trim())
      return fail(new Error("Hạn nộp báo giá không được để trống"), 400);
    const deadlineDate = new Date(tender.deadline);
    if (isNaN(deadlineDate.getTime()))
      return fail(new Error("Hạn nộp báo giá không hợp lệ"), 400);
    // ─────────────────────────────────────────────────────────────────────────

    const previous = tender.id ? (await listTenders()).find((item) => item.id === tender.id) ?? null : null;
    const saved = await upsertTender(tender);
    const action = resolveTenderAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "tender",
      entityId: saved.id,
      entityName: saved.title,
      action,
      description: describeActivity("tender", action, saved.title),
      metadata: {
        code: saved.code,
        status: saved.status,
        category: saved.category,
      },
      oldValues: snapshot(previous),
      newValues: snapshot(saved),
    });
    if (action === "created") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.TENDER_CREATED,
        title: "Gói thầu mới được tạo",
        message: `Gói thầu "${saved.title}" (${saved.code ?? ""}) vừa được tạo, chờ phê duyệt đăng.`,
        link: `/admin/tenders/${saved.id}`,
        metadata: { tenderId: saved.id, tenderCode: saved.code, tenderTitle: saved.title },
      });
    } else if (action === "published") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.TENDER_PUBLISHED,
        title: "Gói thầu đã được đăng",
        message: `Gói thầu "${saved.title}" (${saved.code ?? ""}) hiện đang mở. Nhà cung cấp có thể nộp báo giá.`,
        link: `/admin/tenders/${saved.id}`,
        metadata: { tenderId: saved.id, tenderCode: saved.code, tenderTitle: saved.title },
      });
      const supplierEmails = await getActiveSupplierEmails().catch(() => []);
      void emailTenderPublishedSuppliers(
        supplierEmails,
        saved.title,
        saved.code ?? "",
        saved.deadline ?? "",
        `/tenders/${saved.id}`,
      );
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
