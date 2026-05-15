import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { getBid, listBids, upsertBid } from "@/lib/repositories/procurehub";
import type { SupplierBid } from "@/types/supplierBid";
import type { ActivityAction } from "@/types/activityLog";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

function resolveBidAction(previous: SupplierBid | null, current: SupplierBid): ActivityAction {
  if (!previous) return "submitted";
  if (previous.status !== current.status) {
    if (current.status === "Được chọn") return "awarded";
    return "evaluated";
  }
  return "updated";
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    const url = new URL(request.url);
    const tenderId = url.searchParams.get("tenderId") ?? undefined;

    let bids = await listBids();

    // Security: suppliers may only see their own bids — never other suppliers' data
    if (session?.kind === "supplier") {
      bids = bids.filter((b) => b.supplierId === session.sub);
    }

    // Optional tender filter (used by public tender detail page)
    if (tenderId) {
      bids = bids.filter((b) => b.tenderId === tenderId || b.tenderCode === tenderId);
    }

    return ok(bids);
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
    if (action === "submitted") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.BID_SUBMITTED,
        title: "Báo giá mới được nộp",
        message: `${saved.supplierName} vừa nộp báo giá cho gói thầu ${saved.tenderCode ?? saved.tenderTitle}.`,
        link: `/admin/bids/${saved.id}`,
        metadata: { bidId: saved.id, bidCode: saved.bidCode, supplierId: saved.supplierId, tenderCode: saved.tenderCode },
      });
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
