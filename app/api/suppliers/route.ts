import { fail, ok, unauthorized } from "@/lib/api";
import {
  actorFromSession,
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
  withActorFallback,
} from "@/lib/activity-log";
import { hashPassword } from "@/lib/auth/password";
import { getServerSession } from "@/lib/auth/server";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import {
  checkSupplierDuplicates,
  getSupplier,
  listSuppliers,
  upsertSupplier,
} from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { ActivityAction } from "@/types/activityLog";

const PROCUREMENT_ROLES = ["Admin", "Trưởng phòng vật tư", "Kế hoạch vật tư"];

export const dynamic = "force-dynamic";

function resolveSupplierAction(previous: SupplierAccount | null, current: SupplierAccount): ActivityAction {
  if (!previous) return "created";
  if (previous.status !== current.status) {
    if (current.status === "Đã duyệt") return previous.status === "Tạm khóa" ? "activated" : "approved";
    if (current.status === "Từ chối") return "rejected";
    if (current.status === "Tạm khóa") return "deactivated";
  }
  return "updated";
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();

    if (session.kind === "internal") {
      // Admin/internal can see all suppliers
      return ok(await listSuppliers());
    }

    // Supplier can only see their own record (used for profile/bid form)
    const own = await getSupplier(session.sub);
    return ok(own ? [own] : []);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const supplier = (await request.json()) as SupplierAccount;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!supplier.companyName?.trim())
      return fail(new Error("Tên công ty không được để trống"), 400);
    if (!supplier.email?.trim())
      return fail(new Error("Email không được để trống"), 400);
    if (!supplier.taxCode?.trim())
      return fail(new Error("Mã số thuế không được để trống"), 400);
    if (!supplier.phone?.trim())
      return fail(new Error("Số điện thoại không được để trống"), 400);
    if (!supplier.contactName?.trim())
      return fail(new Error("Họ tên người liên hệ không được để trống"), 400);

    const isNew = !supplier.id;
    if (isNew && !supplier.password?.trim())
      return fail(new Error("Mật khẩu không được để trống"), 400);
    if (isNew && supplier.password!.length < 6)
      return fail(new Error("Mật khẩu tối thiểu 6 ký tự"), 400);

    // Kiểm tra trùng lặp email / taxCode / phone
    const { emailExists, taxCodeExists, phoneExists } = await checkSupplierDuplicates({
      email: supplier.email,
      taxCode: supplier.taxCode,
      phone: supplier.phone,
      excludeId: isNew ? undefined : supplier.id,
    });
    if (emailExists)   return fail(new Error("Email đã được sử dụng bởi tài khoản khác"), 400);
    if (taxCodeExists) return fail(new Error("Mã số thuế đã tồn tại trong hệ thống"), 400);
    if (phoneExists)   return fail(new Error("Số điện thoại đã được sử dụng bởi tài khoản khác"), 400);

    // Hash password khi tạo mới (chỉ hash nếu là plaintext)
    let supplierToSave = supplier;
    if (isNew && supplier.password && !supplier.password_hash) {
      const password_hash = await hashPassword(supplier.password);
      supplierToSave = { ...supplier, password_hash, password: "" };
    }
    // ─────────────────────────────────────────────────────────────────────────

    const previous = supplier.id ? await getSupplier(supplier.id) : null;
    const saved = await upsertSupplier(supplierToSave);
    const action = resolveSupplierAction(previous, saved);
    await logActivitySafe({
      ...withActorFallback(getActorFromRequest(request), withActorFallback(actorFromSession(session), {
        actorId: saved.id,
        actorType: "supplier",
        actorName: saved.companyName,
        actorEmail: saved.email,
      })),
      entityType: "supplier",
      entityId: saved.id,
      entityName: saved.companyName,
      action,
      description: describeActivity("supplier", action, saved.companyName),
      metadata: {
        taxCode: saved.taxCode,
        email: saved.email,
        phone: saved.phone,
        status: saved.status,
      },
      oldValues: snapshot(previous),
      newValues: snapshot(saved),
    });
    if (action === "created") {
      await notifyInternalByRolesSafe(PROCUREMENT_ROLES, {
        type: NotificationType.SUPPLIER_REGISTERED,
        title: "Nhà cung cấp mới đăng ký",
        message: `${saved.companyName} vừa đăng ký tài khoản nhà cung cấp. Cần xét duyệt hồ sơ.`,
        link: `/admin/suppliers/${saved.id}`,
        metadata: { supplierId: saved.id, supplierName: saved.companyName },
      });
    }
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
