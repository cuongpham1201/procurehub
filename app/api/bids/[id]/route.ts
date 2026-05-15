import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { createNotificationSafe, notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { deleteBidRecord, getBid, upsertBid } from "@/lib/repositories/procurehub";
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
    if (previous?.status === "Cần bổ sung" && saved.status === "Đã bổ sung") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.BID_SUBMITTED,
        title: "Nhà cung cấp đã cập nhật báo giá",
        message: `${saved.supplierName} đã cập nhật báo giá ${saved.bidCode} cho gói thầu ${saved.tenderCode ?? saved.tenderTitle}.`,
        link: `/admin/bids/${saved.id}`,
        metadata: { bidId: saved.id, bidCode: saved.bidCode, tenderCode: saved.tenderCode, supplierId: saved.supplierId },
      });
    } else if (action === "awarded" && saved.supplierId) {
      await createNotificationSafe({
        userId: saved.supplierId, userKind: "supplier",
        type: NotificationType.BID_AWARDED,
        title: "Báo giá được chọn!",
        message: `Chúc mừng! Báo giá ${saved.bidCode} của bạn cho gói thầu ${saved.tenderCode ?? saved.tenderTitle} đã được chọn.`,
        link: "/supplier/bids",
        metadata: { bidId: saved.id, bidCode: saved.bidCode, tenderCode: saved.tenderCode },
      });
    } else if (action === "evaluated" && saved.supplierId && saved.status === "Không được chọn") {
      await createNotificationSafe({
        userId: saved.supplierId, userKind: "supplier",
        type: NotificationType.BID_REJECTED,
        title: "Báo giá không được chọn",
        message: `Báo giá ${saved.bidCode} của bạn cho gói thầu ${saved.tenderCode ?? saved.tenderTitle} không được chọn lần này. Cảm ơn bạn đã tham gia.`,
        link: "/supplier/bids",
        metadata: { bidId: saved.id, bidCode: saved.bidCode, tenderCode: saved.tenderCode },
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
