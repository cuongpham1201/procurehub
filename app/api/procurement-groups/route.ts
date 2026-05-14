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

export async function GET() {
  try {
    return ok(await listCategories());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const category = (await request.json()) as PurchaseCategory;
    const previous = category.id ? (await listCategories()).find((item) => item.id === category.id) ?? null : null;
    const saved = await upsertCategory(category);
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
