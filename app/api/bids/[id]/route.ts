import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { deleteBidRecord, getBid, upsertBid } from "@/lib/repositories/procurehub";
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getBid(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bid = (await request.json()) as SupplierBid;
    const previous = await getBid(id);
    const saved = await upsertBid({ ...bid, id });
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const previous = await getBid(id);
    await deleteBidRecord(id);
    if (previous) {
      await logActivitySafe({
        ...withActorFallback(getActorFromRequest(request), {
          actorId: previous.supplierId,
          actorType: "supplier",
          actorName: previous.supplierName,
          actorEmail: previous.supplierEmail,
        }),
        entityType: "bid",
        entityId: previous.id,
        entityName: previous.bidCode,
        action: "withdrawn",
        description: `Xóa báo giá ${previous.bidCode}`,
        metadata: {
          bidCode: previous.bidCode,
          tenderId: previous.tenderId,
          tenderCode: previous.tenderCode,
          supplierId: previous.supplierId,
          supplierName: previous.supplierName,
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
