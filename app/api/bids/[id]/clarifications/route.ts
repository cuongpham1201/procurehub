import { fail, forbidden, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  getActorFromRequest,
  logActivitySafe,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { createNotificationDedupedSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { emailClarificationRequested } from "@/lib/email/service";
import {
  getBid,
  createBidClarification,
  listBidClarifications,
} from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const { id: bidId } = await params;

    // Supplier chỉ xem clarifications của bid mình
    if (session.kind === "supplier") {
      const bid = await getBid(bidId);
      if (!bid || bid.supplierId !== session.sub) return forbidden();
    }

    const clarifications = await listBidClarifications(bidId);
    return ok(clarifications);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();

    const { id: bidId } = await params;
    const { requestNote } = (await request.json()) as { requestNote: string };

    if (!requestNote?.trim())
      return fail(new Error("Nội dung yêu cầu làm rõ không được để trống"), 400);

    const bid = await getBid(bidId);
    if (!bid) return fail(new Error("Báo giá không tồn tại"), 404);

    const clarification = await createBidClarification({
      bidId,
      tenderId: bid.tenderId,
      requestedBy: session.sub,
      requestedByName: session.name,
      requestNote: requestNote.trim(),
    });

    // Thông báo cho supplier
    await createNotificationDedupedSafe({
      userId: bid.supplierId,
      userKind: "supplier",
      type: NotificationType.BID_NEED_MORE_INFO,
      title: "Yêu cầu làm rõ báo giá",
      message: `Phòng mua sắm yêu cầu làm rõ báo giá ${bid.bidCode}: "${requestNote.trim()}"`,
      link: `/supplier/bids`,
      metadata: { bidId, bidCode: bid.bidCode, clarificationId: clarification.id },
    });
    // Email notification (fire-and-forget, in addition to in-app)
    await emailClarificationRequested(
      bid.supplierEmail,
      bid.supplierName,
      bid.bidCode,
      bid.tenderTitle ?? bid.tenderCode ?? "",
      requestNote.trim(),
    );

    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "bid",
      entityId: bidId,
      entityName: bid.bidCode,
      action: "clarification_requested",
      description: `Yêu cầu làm rõ báo giá ${bid.bidCode}: ${requestNote.trim()}`,
      metadata: { bidCode: bid.bidCode, clarificationId: clarification.id, requestNote: requestNote.trim() },
      oldValues: null,
      newValues: null,
    });

    return ok(clarification);
  } catch (error) {
    return fail(error);
  }
}
