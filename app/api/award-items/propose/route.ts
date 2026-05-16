// KHVT đề xuất kết quả — tender chuyển sang "Chờ phê duyệt",
// bids có award items → "Đề xuất chọn".
// Trưởng phòng / Admin sẽ finalize sau qua /api/award-items/finalize.
import { fail, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { getServerSession } from "@/lib/auth/server";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { emailAwardProposed } from "@/lib/email/service";
import {
  getInternalEmailsByRoles,
  getTender,
  listAwardItems,
  proposeAwards,
} from "@/lib/repositories/procurehub";

const APPROVAL_ROLES = ["Admin", "Trưởng phòng vật tư", "Ban giám đốc"];

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();

    const { tenderId } = (await request.json()) as { tenderId: string };
    if (!tenderId) return fail(new Error("tenderId required"), 400);

    const awards = await listAwardItems(tenderId);
    if (awards.length === 0)
      return fail(new Error("Chưa có mặt hàng nào được chọn NCC để đề xuất"), 400);

    const tenderBefore = await getTender(tenderId);

    await proposeAwards(tenderId);

    const tenderAfter = await getTender(tenderId);

    // Thông báo cho approvers
    await notifyInternalByRolesSafe(APPROVAL_ROLES, {
      type: NotificationType.AWARD_PROPOSED,
      title: "Đề xuất kết quả cần phê duyệt",
      message: `Gói thầu "${tenderBefore?.title ?? tenderId}" đã có đề xuất kết quả. Vui lòng xem xét và chốt kết quả.`,
      link: `/admin/tenders/${tenderId}/comparison`,
      metadata: { tenderId, tenderCode: tenderBefore?.code, tenderTitle: tenderBefore?.title },
    });

    // Email notification (fire-and-forget)
    const approverEmails = await getInternalEmailsByRoles(APPROVAL_ROLES).catch(() => []);
    await emailAwardProposed(
      approverEmails,
      tenderBefore?.title ?? tenderId,
      tenderBefore?.code ?? "",
      session.name,
      `/admin/tenders/${tenderId}/comparison`,
    );

    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), actorFromSession(session)),
      entityType: "tender",
      entityId: tenderId,
      entityName: tenderBefore?.title ?? tenderId,
      action: "proposed",
      description: describeActivity("tender", "proposed", tenderBefore?.title ?? tenderId),
      metadata: {
        tenderCode: tenderBefore?.code,
        proposedItemCount: awards.length,
        proposedBy: session.name,
        proposedByRole: session.role,
      },
      oldValues: snapshot(tenderBefore),
      newValues: snapshot(tenderAfter),
    });

    return ok({ success: true, proposedItems: awards.length });
  } catch (error) {
    return fail(error);
  }
}
