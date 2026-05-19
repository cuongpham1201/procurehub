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
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { getBid, getInternalEmailsByRoles, getSupplier, getTender, listBids, upsertBid } from "@/lib/repositories/procurehub";
import { emailBidSubmitted } from "@/lib/email/service";
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
    if (!session) return unauthorized();

    const url = new URL(request.url);
    const tenderId = url.searchParams.get("tenderId") ?? undefined;
    const supplierId = url.searchParams.get("supplierId") ?? undefined;

    let bids = await listBids();

    // Internal phải có bids:read
    if (session.kind === "internal" && !(await hasPermissionDB(session.role, "bids:read")))
      return forbidden(`Vai trò "${session.role}" không có quyền xem báo giá`);

    // Security: suppliers may only see their own bids — never other suppliers' data
    if (session.kind === "supplier") {
      bids = bids.filter((b) => b.supplierId === session.sub);
    } else if (supplierId) {
      // Internal user filtering by specific supplier
      bids = bids.filter((b) => b.supplierId === supplierId);
    }

    // Optional tender filter (used by admin comparison and supplier tender detail)
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
    const session = await getServerSession();
    if (!session) return unauthorized();
    if (session.kind !== "supplier") return unauthorized("Chỉ nhà cung cấp mới được nộp báo giá");
    const bid = (await request.json()) as SupplierBid;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!bid.tenderId?.trim())
      return fail(new Error("Gói thầu không được để trống"), 400);

    // Supplier phải được duyệt mới được nộp báo giá
    const supplierRecord = await getSupplier(session.sub);
    if (!supplierRecord || supplierRecord.status !== "Đã duyệt")
      return forbidden("Tài khoản nhà cung cấp chưa được phê duyệt. Vui lòng chờ phòng mua sắm xét duyệt hồ sơ.");

    // supplierId phải khớp với JWT session — không cho phép submit thay mặt NCC khác
    if (bid.supplierId && bid.supplierId !== session.sub)
      return forbidden("Không có quyền nộp báo giá thay nhà cung cấp khác");

    // Nếu update bid cũ, kiểm tra ownership
    if (bid.id) {
      const existing = await getBid(bid.id);
      if (existing && existing.supplierId !== session.sub)
        return forbidden("Không có quyền chỉnh sửa báo giá này");
    }

    // Gói thầu phải đang nhận báo giá
    const tender = await getTender(bid.tenderId);
    if (!tender)
      return fail(new Error("Gói thầu không tồn tại"), 404);
    if (tender.status !== "Đang nhận báo giá")
      return fail(new Error(`Gói thầu hiện không nhận báo giá (trạng thái: ${tender.status})`), 400);

    // Kiểm tra deadline — date-only string (YYYY-MM-DD) được hiểu là hết ngày theo giờ VN (UTC+7)
    if (tender.deadline) {
      const trimmed = tender.deadline.trim();
      const deadline = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? new Date(`${trimmed}T23:59:59+07:00`)
        : new Date(trimmed);
      if (!isNaN(deadline.getTime()) && deadline < new Date())
        return fail(new Error("Gói thầu đã hết hạn nộp báo giá"), 400);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Gán supplierId từ session — không tin giá trị client gửi lên
    const bidToSave: SupplierBid = { ...bid, supplierId: session.sub };

    const previous = bid.id ? await getBid(bid.id) : null;
    const saved = await upsertBid(bidToSave);
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
      const internalEmails = await getInternalEmailsByRoles(PROCUREMENT_ROLES).catch(() => []);
      void emailBidSubmitted(
        internalEmails,
        saved.supplierName,
        saved.bidCode,
        saved.tenderTitle ?? saved.tenderCode ?? "",
        `/admin/bids/${saved.id}`,
      );
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
