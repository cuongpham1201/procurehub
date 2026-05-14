import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { getMaterial, listMaterials, upsertMaterial } from "@/lib/repositories/procurehub";
import type { MaterialItem } from "@/types/category";
import type { ActivityAction } from "@/types/activityLog";

export const dynamic = "force-dynamic";

function resolveMaterialAction(previous: MaterialItem | null, current: MaterialItem): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    return current.status === "Tạm khóa" ? "locked" : "unlocked";
  }
  return "updated";
}

export async function GET() {
  try {
    return ok(await listMaterials());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const material = (await request.json()) as MaterialItem;
    const previous = material.id ? await getMaterial(material.id) : null;
    const saved = await upsertMaterial(material);
    const action = resolveMaterialAction(previous, saved);
    await logActivitySafe({
      ...getActorFromRequest(request),
      entityType: "material",
      entityId: saved.id,
      entityName: saved.materialName,
      action,
      description: describeActivity("material", action, saved.materialName),
      metadata: {
        materialCode: saved.materialCode,
        categoryId: saved.categoryId,
        categoryName: saved.categoryName,
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
