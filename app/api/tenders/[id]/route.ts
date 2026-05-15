import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { deleteTenderRecord, getTender, upsertTender } from "@/lib/repositories/procurehub";
import type { AdminTender } from "@/types/adminTender";
import type { ActivityAction } from "@/types/activityLog";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

function resolveTenderAction(previous: AdminTender | null, current: AdminTender): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    if (current.status === "Đang mở") return "published";
    if (current.status === "Đã hủy") return "cancelled";
    if (current.status === "Đã đóng") return "closed";
    if (current.status === "Đã có kết quả") return "awarded";
  }
  return "updated";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getTender(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tender = (await request.json()) as AdminTender;
    const previous = await getTender(id);
    const saved = await upsertTender({ ...tender, id });
    const action = resolveTenderAction(previous, saved);
    await logActivitySafe({
      ...getActorFromRequest(request),
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
    if (action === "published") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.TENDER_PUBLISHED,
        title: "Gói thầu đã được đăng",
        message: `Gói thầu "${saved.title}" (${saved.code ?? ""}) hiện đang mở nhận báo giá.`,
        link: `/admin/tenders/${saved.id}`,
        metadata: { tenderId: saved.id, tenderCode: saved.code },
      });
    } else if (action === "closed") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.TENDER_CLOSED,
        title: "Gói thầu đã đóng",
        message: `Gói thầu "${saved.title}" (${saved.code ?? ""}) đã đóng nhận báo giá. Có thể tiến hành đánh giá.`,
        link: `/admin/tenders/${saved.id}`,
        metadata: { tenderId: saved.id, tenderCode: saved.code },
      });
    } else if (action === "cancelled") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.TENDER_CANCELLED,
        title: "Gói thầu đã hủy",
        message: `Gói thầu "${saved.title}" (${saved.code ?? ""}) đã bị hủy.`,
        link: `/admin/tenders/${saved.id}`,
        metadata: { tenderId: saved.id, tenderCode: saved.code },
      });
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const previous = await getTender(id);
    await deleteTenderRecord(id);
    if (previous) {
      await logActivitySafe({
        ...getActorFromRequest(request),
        entityType: "tender",
        entityId: previous.id,
        entityName: previous.title,
        action: "cancelled",
        description: `Xóa dữ liệu gói thầu ${previous.title}`,
        metadata: {
          code: previous.code,
          deleted: true,
        },
        oldValues: snapshot(previous),
        newValues: null,
      });
    }
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
