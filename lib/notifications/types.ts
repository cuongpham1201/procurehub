export const NotificationType = {
  // Supplier lifecycle
  SUPPLIER_REGISTERED:     "SUPPLIER_REGISTERED",
  SUPPLIER_APPROVED:       "SUPPLIER_APPROVED",
  SUPPLIER_REJECTED:       "SUPPLIER_REJECTED",
  SUPPLIER_DEACTIVATED:    "SUPPLIER_DEACTIVATED",
  SUPPLIER_NEED_MORE_INFO: "SUPPLIER_NEED_MORE_INFO",
  // Tender lifecycle
  TENDER_CREATED:       "TENDER_CREATED",
  TENDER_PUBLISHED:     "TENDER_PUBLISHED",
  TENDER_CLOSING_SOON:  "TENDER_CLOSING_SOON",
  TENDER_CLOSED:        "TENDER_CLOSED",
  TENDER_CANCELLED:     "TENDER_CANCELLED",
  // Bid lifecycle
  BID_SUBMITTED:        "BID_SUBMITTED",
  BID_AWARDED:          "BID_AWARDED",
  BID_REJECTED:         "BID_REJECTED",
  BID_NEED_MORE_INFO:   "BID_NEED_MORE_INFO",
  AWARD_PROPOSED:       "AWARD_PROPOSED",
  // System
  SYSTEM_ALERT:         "SYSTEM_ALERT",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationRow {
  id: string;
  userId: string;
  userKind: "internal" | "supplier";
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}

export interface CreateNotificationInput {
  userId: string;
  userKind: "internal" | "supplier";
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/** Icon/color config per notification type — used by UI components */
export interface NotificationMeta {
  icon: "user" | "check" | "x" | "file" | "bid" | "alert" | "bell";
  color: "blue" | "green" | "red" | "amber" | "slate";
}

export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  SUPPLIER_REGISTERED:     { icon: "user",  color: "blue"  },
  SUPPLIER_APPROVED:       { icon: "check", color: "green" },
  SUPPLIER_REJECTED:       { icon: "x",     color: "red"   },
  SUPPLIER_DEACTIVATED:    { icon: "alert", color: "amber" },
  SUPPLIER_NEED_MORE_INFO: { icon: "alert", color: "amber" },
  TENDER_CREATED:       { icon: "file",  color: "blue"  },
  TENDER_PUBLISHED:     { icon: "file",  color: "green" },
  TENDER_CLOSING_SOON:  { icon: "alert", color: "amber" },
  TENDER_CLOSED:        { icon: "file",  color: "slate" },
  TENDER_CANCELLED:     { icon: "x",     color: "red"   },
  BID_SUBMITTED:        { icon: "bid",   color: "blue"  },
  BID_AWARDED:          { icon: "check", color: "green" },
  BID_REJECTED:         { icon: "x",     color: "red"   },
  BID_NEED_MORE_INFO:   { icon: "alert", color: "amber" },
  AWARD_PROPOSED:       { icon: "bid",   color: "amber" },
  SYSTEM_ALERT:         { icon: "bell",  color: "amber" },
};
