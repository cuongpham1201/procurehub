import { fail, forbidden, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  getActorFromRequest,
  logActivitySafe,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { emailClarificationResponded } from "@/lib/email/service";
import {
  getBid,
  getInternalEmailsByRoles,
  listBidClarifications,
  respondToBidClarification,
} from "@/lib/repositories/procurehub";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

// PUT — supplier phản hồi yêu cầu làm rõ
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    const { id: bidId, cid } = await params;

    // Chỉ supplier chính chủ hoặc internal mới được respond
    const bid = await getBid(bidId);
    if (!bid) return fail(new Error("Báo giá không tồn tại"), 404);

    if (session.kind === "supplier" && bid.supplierId !== session.sub)
      return forbidden("Không có quyền phản hồi báo giá này");

    // Kiểm tra clarification thuộc bid này
    const allClarifications = await listBidClarifications(bidId);
    const clarification = allClarifications.find((c) => c.id === cid);
    if (!clarification) return fail(new Error("Yêu cầu làm rõ không tồn tại"), 404);
    if (clarification.status === "responded")
      return fail(new Error("Yêu cầu này đã được phản hồi"), 400);

    const { responseNote } = (await request.json()) as { responseNote: string };
    if (!responseNote?.trim())
      return fail(new Error("Nội dung phản hồi không được để trống"), 400);

    const updated = await respondToBidClarification(
      cid,
      session.sub,
      session.kind === "supplier" ? (bid.supplierName ?? session.name) : session.name,
      responseNote.trim(),
    );

    // Thông báo cho procurement team
    await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
      type: NotificationType.BID_SUBMITTED,
      title: "Nhà cung cấp đã phản hồi yêu cầu làm rõ",
      message: `${bid.supplierName} đã phản hồi yêu cầu làm rõ báo giá ${bid.bidCode}: "${responseNote.trim()}"`,
      link: `/admin/bids/${bidId}`,
      metadata: { bidId, bidCode: bid.bidCode, clarificationId: cid },
    });

    // Email notification (fire-and-forget)
    const internalEmails = await getInternalEmailsByRoles(PROCUREMENT_ROLES).catch(() => []);
    await emailClarificationResponded(
      internalEmails,
      bid.bidCode,
      bid.supplierName,
      bid.tenderTitle ?? bid.tenderCode ?? "",
      responseNote.trim(),
      `/admin/bids/${bidId}`,
    );

    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "bid",
      entityId: bidId,
      entityName: bid.bidCode,
      action: "clarification_responded",
      description: `Phản hồi yêu cầu làm rõ báo giá ${bid.bidCode}`,
      metadata: { bidCode: bid.bidCode, clarificationId: cid, responseNote: responseNote.trim() },
      oldValues: null,
      newValues: null,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
