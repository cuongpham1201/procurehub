import { randomUUID } from "crypto";
import { createActivityLog } from "@/lib/repositories/procurehub";
import type {
  ActivityAction,
  ActivityActorType,
  ActivityEntityType,
  ActivityLog,
  ActivityLogInput,
  ActivityPayload,
} from "@/types/activityLog";

export type ActivityActor = {
  actorId?: string;
  actorType?: ActivityActorType;
  actorName?: string;
  actorEmail?: string;
};

function headerValue(headers: Headers, key: string): string | undefined {
  const value = headers.get(key)?.trim();
  return value ? value : undefined;
}

export function getActorFromRequest(request: Request): ActivityActor {
  return {
    actorId: headerValue(request.headers, "x-actor-id"),
    actorType: (headerValue(request.headers, "x-actor-type") as ActivityActorType | undefined) ?? undefined,
    actorName: headerValue(request.headers, "x-actor-name"),
    actorEmail: headerValue(request.headers, "x-actor-email"),
  };
}

export function withActorFallback(
  actor: ActivityActor,
  fallback?: ActivityActor,
): ActivityActor {
  return {
    actorId: actor.actorId ?? fallback?.actorId,
    actorType: actor.actorType ?? fallback?.actorType,
    actorName: actor.actorName ?? fallback?.actorName,
    actorEmail: actor.actorEmail ?? fallback?.actorEmail,
  };
}

export function snapshot<T>(value: T | null | undefined): ActivityPayload | null {
  if (value === null || value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as ActivityPayload;
}

export async function logActivity(input: ActivityLogInput): Promise<ActivityLog> {
  const log: ActivityLog = {
    ...input,
    id: `ACT-${randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  return createActivityLog(log);
}

export async function logActivitySafe(input: ActivityLogInput): Promise<void> {
  try {
    await logActivity(input);
  } catch (error) {
    console.error("Failed to write activity log", error);
  }
}

export function describeActivity(
  entityType: ActivityEntityType,
  action: ActivityAction,
  entityName: string,
): string {
  const entityLabel =
    entityType === "tender"
      ? "gói thầu"
      : entityType === "supplier"
      ? "nhà cung cấp"
      : entityType === "bid"
      ? "báo giá"
      : entityType === "category"
      ? "nhóm mua sắm"
      : entityType === "material"
      ? "mã vật tư"
      : "người dùng";

  const actionLabel =
    action === "created"
      ? "Tạo mới"
      : action === "updated"
      ? "Cập nhật"
      : action === "published"
      ? "Phát hành"
      : action === "cancelled"
      ? "Hủy"
      : action === "closed"
      ? "Đóng"
      : action === "awarded"
      ? "Trao thầu"
      : action === "approved"
      ? "Phê duyệt"
      : action === "rejected"
      ? "Từ chối"
      : action === "activated"
      ? "Kích hoạt"
      : action === "deactivated"
      ? "Vô hiệu hóa"
      : action === "submitted"
      ? "Nộp"
      : action === "withdrawn"
      ? "Xóa/Rút"
      : action === "evaluated"
      ? "Đánh giá"
      : action === "locked"
      ? "Khóa"
      : action === "unlocked"
      ? "Mở khóa"
      : "Đổi vai trò";

  return `${actionLabel} ${entityLabel} ${entityName}`.trim();
}
