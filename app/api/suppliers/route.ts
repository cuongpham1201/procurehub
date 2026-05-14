import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getSupplier, listSuppliers, upsertSupplier } from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { ActivityAction } from "@/types/activityLog";

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

export async function GET() {
  try {
    return ok(await listSuppliers());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const supplier = (await request.json()) as SupplierAccount;
    const previous = supplier.id ? await getSupplier(supplier.id) : null;
    const saved = await upsertSupplier(supplier);
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
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
