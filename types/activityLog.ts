export const ACTIVITY_ENTITY_TYPES = [
  "tender",
  "supplier",
  "bid",
  "category",
  "material",
  "user",
] as const;

export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const ACTIVITY_ACTIONS = [
  "created",
  "updated",
  "published",
  "cancelled",
  "closed",
  "awarded",
  "approved",
  "rejected",
  "activated",
  "deactivated",
  "submitted",
  "withdrawn",
  "evaluated",
  "revision_requested",
  "clarification_requested",
  "clarification_responded",
  "proposed",
  "file_uploaded",
  "file_deleted",
  "locked",
  "unlocked",
  "role_changed",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export type ActivityActorType = "internal_user" | "supplier" | "system";

export type ActivityPayload = Record<string, unknown>;

export interface ActivityLog {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  action: ActivityAction;
  actorId?: string;
  actorType?: ActivityActorType;
  actorName?: string;
  actorEmail?: string;
  description: string;
  metadata?: ActivityPayload | null;
  oldValues?: ActivityPayload | null;
  newValues?: ActivityPayload | null;
  createdAt: string;
}

export type ActivityLogInput = Omit<ActivityLog, "id" | "createdAt">;

export interface ActivityLogFilters {
  entityType?: ActivityEntityType | "";
  action?: ActivityAction | "";
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityLogListResponse {
  items: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  tender: "Gói thầu",
  supplier: "Nhà cung cấp",
  bid: "Báo giá",
  category: "Nhóm mua sắm",
  material: "Vật tư",
  user: "Người dùng",
};

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  created: "Tạo mới",
  updated: "Cập nhật",
  published: "Phát hành",
  cancelled: "Hủy",
  closed: "Đóng",
  awarded: "Trao thầu",
  approved: "Phê duyệt",
  rejected: "Từ chối",
  activated: "Kích hoạt",
  deactivated: "Vô hiệu hóa",
  submitted: "Nộp",
  withdrawn: "Rút/Xóa",
  evaluated: "Đánh giá",
  revision_requested: "Yêu cầu bổ sung",
  clarification_requested: "Yêu cầu làm rõ",
  clarification_responded: "Phản hồi làm rõ",
  proposed: "Đề xuất kết quả",
  file_uploaded: "Tải lên tài liệu",
  file_deleted: "Xóa tài liệu",
  locked: "Khóa",
  unlocked: "Mở khóa",
  role_changed: "Đổi vai trò",
};
