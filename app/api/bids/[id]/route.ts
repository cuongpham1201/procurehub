import { fail, forbidden, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { hasPermissionDB } from "@/lib/auth/rbac-server";
import {
  createNotificationDedupedSafe,
  notifyInternalByRolesSafe,
} from "@/lib/notifications/service";
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
    if (current.status === "Cần làm rõ") return "clarification_requested";
    return "evaluated";
  }
  return "updated";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const bid = await getBid(id);
    // Supplier may only read their own bid
    if (session.kind === "supplier" && bid?.supplierId !== session.sub) return unauthorized();
    // Internal phải có bids:read
    if (session.kind === "internal" && !(await hasPermissionDB(session.role, "bids:read")))
      return forbidden(`Vai trò "${session.role}" không có quyền xem báo giá`);
    return ok(bid);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const bid = (await request.json()) as SupplierBid;
    const previous = await getBid(id);
    // Supplier may only update their own bid; internal users can update any
    if (session.kind === "supplier" && previous?.supplierId !== session.sub) return unauthorized();
    const saved = await upsertBid({ ...bid, id });
    const action = resolveBidAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), withActorFallback(actorFromSession(session), {
        actorId: saved.supplierId,
        actorType: "supplier",
        actorName: saved.supplierName,
        actorEmail: saved.supplierEmail,
      })),
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
    if (action === "revision_requested" && saved.supplierId) {
      // Notify the supplier that their bid needs revision
      await createNotificationDedupedSafe({
        userId: saved.supplierId, userKind: "supplier",
        type: NotificationType.BID_NEED_MORE_INFO,
        title: "Báo giá cần bổ sung thông tin",
        message: `Báo giá ${saved.bidCode} cho gói thầu ${saved.tenderCode ?? saved.tenderTitle} cần được bổ sung. Vui lòng cập nhật và gửi lại báo giá.`,
        link: `/supplier/submit-bid?tenderId=${saved.tenderId}&edit=${saved.id}`,
        metadata: { bidId: saved.id, bidCode: saved.bidCode, tenderCode: saved.tenderCode, tenderId: saved.tenderId },
      });
    } else if (previous?.status === "Cần làm rõ" && saved.status === "Đã phản hồi") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.BID_SUBMITTED,
        title: "Nhà cung cấp đã cập nhật báo giá",
        message: `${saved.supplierName} đã cập nhật báo giá ${saved.bidCode} cho gói thầu ${saved.tenderCode ?? saved.tenderTitle}.`,
        link: `/admin/bids/${saved.id}`,
        metadata: { bidId: saved.id, bidCode: saved.bidCode, tenderCode: saved.tenderCode, supplierId: saved.supplierId },
      });
    }
    // Note: BID_AWARDED and BID_REJECTED notifications are sent exclusively
    // by /api/award-items/finalize to avoid duplicates when batch-finalizing.
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const previous = await getBid(id);
    // Supplier may only delete their own bid; internal users can delete any
    if (session.kind === "supplier" && previous?.supplierId !== session.sub) return unauthorized();
    await deleteBidRecord(id);
    if (previous) {
      await logActivitySafe({
        ...withActorFallback(getActorFromRequest(request), withActorFallback(actorFromSession(session), {
          actorId: previous.supplierId,
          actorType: "supplier",
          actorName: previous.supplierName,
          actorEmail: previous.supplierEmail,
        })),
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
