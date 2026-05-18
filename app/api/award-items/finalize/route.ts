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
import { createNotificationDedupedSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { hasPermissionDB } from "@/lib/auth/rbac-server";
import { emailAwardFinalized } from "@/lib/email/service";
import {
  finalizeAwards,
  getBidsByTender,
  getTender,
  listAwardItems,
} from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    // Chỉ Trưởng phòng vật tư / Admin mới được chốt kết quả
    if (!(await hasPermissionDB(session.role, "bids:evaluate")))
      return forbidden(`Vai trò "${session.role}" không có quyền chốt kết quả. Chỉ Trưởng phòng vật tư hoặc Admin mới được thực hiện thao tác này.`);
    const { tenderId } = (await request.json()) as { tenderId: string };
    if (!tenderId) return fail(new Error("tenderId required"), 400);

    // Capture state before finalize for activity log
    const tenderBefore = await getTender(tenderId);
    const awards = await listAwardItems(tenderId);

    if (awards.length === 0) {
      return fail(new Error("Chưa có mặt hàng nào được chọn NCC"), 400);
    }

    await finalizeAwards(tenderId);

    // Fetch updated bids to send notifications (only for this tender — avoids full table scan)
    const tenderBids = await getBidsByTender(tenderId);
    const awardedBidIds = new Set(awards.map((a) => a.bidId));

    for (const bid of tenderBids) {
      if (!bid.supplierId) continue;
      const selected = awardedBidIds.has(bid.id);
      if (selected) {
        await createNotificationDedupedSafe({
          userId: bid.supplierId,
          userKind: "supplier",
          type: NotificationType.BID_AWARDED,
          title: "Báo giá được chọn!",
          message: `Chúc mừng! Báo giá ${bid.bidCode} của bạn cho gói thầu ${bid.tenderCode ?? bid.tenderTitle} đã được chọn.`,
          link: "/supplier/bids",
          metadata: { bidId: bid.id, bidCode: bid.bidCode, tenderCode: bid.tenderCode },
        });
      } else {
        await createNotificationDedupedSafe({
          userId: bid.supplierId,
          userKind: "supplier",
          type: NotificationType.BID_REJECTED,
          title: "Báo giá không được chọn",
          message: `Báo giá ${bid.bidCode} của bạn cho gói thầu ${bid.tenderCode ?? bid.tenderTitle} không được chọn lần này. Cảm ơn bạn đã tham gia.`,
          link: "/supplier/bids",
          metadata: { bidId: bid.id, bidCode: bid.bidCode, tenderCode: bid.tenderCode },
        });
      }
      // Email notification (fire-and-forget)
      await emailAwardFinalized(
        bid.supplierEmail,
        bid.supplierName ?? "",
        bid.bidCode,
        tenderBefore?.title ?? bid.tenderTitle ?? bid.tenderCode ?? tenderId,
        selected,
      );
    }

    const tenderAfter = await getTender(tenderId);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "tender",
      entityId: tenderId,
      entityName: tenderBefore?.title ?? tenderId,
      action: "awarded",
      description: describeActivity("tender", "awarded", tenderBefore?.title ?? tenderId),
      metadata: {
        tenderCode: tenderBefore?.code,
        awardedCount: awards.length,
        supplierCount: awardedBidIds.size,
      },
      oldValues: snapshot(tenderBefore),
      newValues: snapshot(tenderAfter),
    });

    return ok({ success: true, awardedItems: awards.length });
  } catch (error) {
    return fail(error);
  }
}
