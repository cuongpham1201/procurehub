import { randomUUID } from "crypto";
import { fail, forbidden, ok, unauthorized } from "@/lib/api";
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
import { hasPermissionDB } from "@/lib/auth/rbac-server";
import { notifyInternalByRolesSafe } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";
import { emailSupplierActivation } from "@/lib/email/service";
import {
  checkSupplierDuplicates,
  getSupplier,
  listSuppliers,
  setSupplierActivation,
  upsertSupplier,
} from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";
import type { ActivityAction } from "@/types/activityLog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dauthau.zlab.io.vn";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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
      if (!(await hasPermissionDB(session.role, "suppliers:read")))
        return forbidden(`Vai trò "${session.role}" không có quyền xem nhà cung cấp`);
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

    // Hash password khi update profile (internal admin giữ lại logic cũ)
    let supplierToSave = supplier;
    if (!isNew && supplier.password && !supplier.password_hash) {
      const password_hash = await hashPassword(supplier.password);
      supplierToSave = { ...supplier, password_hash, password: "" };
    }
    // Khi tạo mới: không nhận password từ client, sẽ set sau
    if (isNew) {
      supplierToSave = { ...supplier, password: "", password_hash: undefined };
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
      // Generate temp password + verification token, store in DB, send activation email
      const tempPassword = generateTempPassword();
      const verificationToken = randomUUID();
      const passwordHash = await hashPassword(tempPassword);
      await setSupplierActivation(saved.id, passwordHash, verificationToken);

      const verifyUrl = `${APP_URL}/supplier/verify-email?token=${verificationToken}`;
      void emailSupplierActivation(saved.email, saved.companyName, tempPassword, verifyUrl);

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
