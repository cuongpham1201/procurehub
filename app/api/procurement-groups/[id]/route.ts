import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { listCategories, upsertCategory } from "@/lib/repositories/procurehub";
import type { PurchaseCategory } from "@/types/category";
import type { ActivityAction } from "@/types/activityLog";

export const dynamic = "force-dynamic";

function resolveCategoryAction(previous: PurchaseCategory | null, current: PurchaseCategory): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    return current.status === "Tạm khóa" ? "locked" : "unlocked";
  }
  return "updated";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = (await request.json()) as PurchaseCategory;
    const previous = (await listCategories()).find((item) => item.id === id) ?? null;
    const saved = await upsertCategory({ ...category, id });
    const action = resolveCategoryAction(previous, saved);
    await logActivitySafe({
      ...getActorFromRequest(request),
      entityType: "category",
      entityId: saved.id,
      entityName: saved.name,
      action,
      description: describeActivity("category", action, saved.name),
      metadata: {
        code: saved.code,
        status: saved.status,
      },
      oldValues: snapshot(previous),
      newValues: snapshot(saved),
    });
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
