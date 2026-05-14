import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getBid, listBids, upsertBid } from "@/lib/repositories/procurehub";
import type { SupplierBid } from "@/types/supplierBid";
import type { ActivityAction } from "@/types/activityLog";

export const dynamic = "force-dynamic";

function resolveBidAction(previous: SupplierBid | null, current: SupplierBid): ActivityAction {
  if (!previous) return "submitted";
  if (previous.status !== current.status) {
    if (current.status === "Được chọn") return "awarded";
    return "evaluated";
  }
  return "updated";
}

export async function GET() {
  try {
    return ok(await listBids());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const bid = (await request.json()) as SupplierBid;
    const previous = bid.id ? await getBid(bid.id) : null;
    const saved = await upsertBid(bid);
    const action = resolveBidAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), {
        actorId: saved.supplierId,
        actorType: "supplier",
        actorName: saved.supplierName,
        actorEmail: saved.supplierEmail,
      }),
      entityType: "bid",
      entityId: saved.id,
      entityName: saved.bidCode,
      action,
      description: describeActivity("bid", action, saved.bidCode),
      metadata: {
        bidCode: saved.bidCode,
        tenderId: saved.tenderId,
        tenderCode: saved.tenderCode,
        tenderTitle: saved.tenderTitle,
        supplierId: saved.supplierId,
        supplierName: saved.supplierName,
        status: saved.status,
        totalAmount: saved.totalAmount,
      },
      oldValues: snapshot(previous),
      newValues: snapshot(saved),
    });
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
