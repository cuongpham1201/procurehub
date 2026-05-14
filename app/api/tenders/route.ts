import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { listTenders, upsertTender } from "@/lib/repositories/procurehub";
import type { AdminTender } from "@/types/adminTender";
import type { ActivityAction } from "@/types/activityLog";

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
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
