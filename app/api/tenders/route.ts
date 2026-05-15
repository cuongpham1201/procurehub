import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { listTenders, upsertTender } from "@/lib/repositories/procurehub";
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

export async function GET() {
  try {
    return ok(await listTenders());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const tender = (await request.json()) as AdminTender;
    const previous = tender.id ? (await listTenders()).find((item) => item.id === tender.id) ?? null : null;
    const saved = await upsertTender(tender);
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
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
