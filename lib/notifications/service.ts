import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import type {
  CreateNotificationInput,
  NotificationRow,
} from "./types";

/* ── row → domain mapper ─────────────────────────────────────────────────── */

function toRow(r: Record<string, unknown>): NotificationRow {
  return {
    id:        r.id as string,
    userId:    r.user_id as string,
    userKind:  r.user_kind as "internal" | "supplier",
    type:      r.type as NotificationRow["type"],
    title:     r.title as string,
    message:   r.message as string,
    link:      (r.link as string | null) ?? null,
    isRead:    r.is_read as boolean,
    metadata:  (r.metadata as Record<string, unknown>) ?? {},
    createdAt: (r.created_at as Date).toISOString(),
    readAt:    r.read_at ? (r.read_at as Date).toISOString() : null,
  };
}

/* ── create ──────────────────────────────────────────────────────────────── */

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await query(
    `INSERT INTO notifications (id, user_id, user_kind, type, title, message, link, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      randomUUID(),
      input.userId,
      input.userKind,
      input.type,
      input.title,
      input.message,
      input.link ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

/** Fire-and-forget — never throws, mirrors logActivitySafe pattern */
export async function createNotificationSafe(input: CreateNotificationInput): Promise<void> {
  try {
    await createNotification(input);
  } catch {
    // best-effort
  }
}

/** Fan-out to multiple recipients in one batch */
export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs.length) return;
  await Promise.all(inputs.map(createNotification));
}

export async function createNotificationsSafe(inputs: CreateNotificationInput[]): Promise<void> {
  try {
    await createNotifications(inputs);
  } catch {
    // best-effort
  }
}

/* ── fan-out helpers ─────────────────────────────────────────────────────── */

/**
 * Create one notification per internal user whose role is in the given list.
 * Used to broadcast tender/bid events to all procurement staff.
 */
export async function notifyInternalByRoles(
  roles: string[],
  notification: Omit<CreateNotificationInput, "userId" | "userKind">,
): Promise<void> {
  if (!roles.length) return;
  const result = await query<{ id: string }>(
    `SELECT id FROM internal_users WHERE role = ANY($1) AND (status IS NULL OR status != 'inactive')`,
    [roles],
  );
  await createNotifications(
    result.rows.map((r) => ({ ...notification, userId: r.id, userKind: "internal" as const })),
  );
}

export async function notifyInternalByRolesSafe(
  roles: string[],
  notification: Omit<CreateNotificationInput, "userId" | "userKind">,
): Promise<void> {
  try {
    await notifyInternalByRoles(roles, notification);
  } catch {
    // best-effort
  }
}

/* ── query ───────────────────────────────────────────────────────────────── */

export async function listNotifications(
  userId: string,
  userKind: "internal" | "supplier",
  opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
): Promise<NotificationRow[]> {
  const { limit = 30, offset = 0, unreadOnly = false } = opts;
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM notifications
     WHERE user_id = $1 AND user_kind = $2
       ${unreadOnly ? "AND is_read = false" : ""}
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, userKind, limit, offset],
  );
  return result.rows.map(toRow);
}

export async function countUnread(
  userId: string,
  userKind: "internal" | "supplier",
): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT count(*)::text FROM notifications WHERE user_id=$1 AND user_kind=$2 AND is_read=false`,
    [userId, userKind],
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/* ── deduplication helpers ───────────────────────────────────────────────── */

/**
 * Delete any existing unread notification of the same type for this user,
 * then insert a fresh one. Prevents duplicate entries when the same event
 * fires multiple times (e.g. admin toggling status back and forth).
 */
export async function createNotificationDeduped(input: CreateNotificationInput): Promise<void> {
  await query(
    `DELETE FROM notifications WHERE user_id=$1 AND user_kind=$2 AND type=$3 AND is_read=false`,
    [input.userId, input.userKind, input.type],
  );
  await createNotification(input);
}

export async function createNotificationDedupedSafe(input: CreateNotificationInput): Promise<void> {
  try {
    await createNotificationDeduped(input);
  } catch {
    // best-effort
  }
}

/**
 * Fan-out deduped version. For each recipient, deletes existing unread
 * notification of same type (optionally also matching link) before inserting.
 * Pass matchLink: true when type alone is too broad (e.g. SYSTEM_ALERT).
 */
export async function notifyInternalByRolesDeduped(
  roles: string[],
  notification: Omit<CreateNotificationInput, "userId" | "userKind">,
  opts: { matchLink?: boolean } = {},
): Promise<void> {
  if (!roles.length) return;
  const result = await query<{ id: string }>(
    `SELECT id FROM internal_users WHERE role = ANY($1) AND (status IS NULL OR status != 'inactive')`,
    [roles],
  );
  const hasLink = opts.matchLink && notification.link;
  await Promise.all(
    result.rows.map(async (r) => {
      const args: unknown[] = [r.id, notification.type];
      if (hasLink) args.push(notification.link);
      await query(
        `DELETE FROM notifications WHERE user_id=$1 AND user_kind='internal' AND type=$2${hasLink ? " AND link=$3" : ""} AND is_read=false`,
        args,
      );
      await createNotification({ ...notification, userId: r.id, userKind: "internal" });
    }),
  );
}

export async function notifyInternalByRolesDedupedSafe(
  roles: string[],
  notification: Omit<CreateNotificationInput, "userId" | "userKind">,
  opts: { matchLink?: boolean } = {},
): Promise<void> {
  try {
    await notifyInternalByRolesDeduped(roles, notification, opts);
  } catch {
    // best-effort
  }
}

/**
 * Mark all unread notifications of given types as read for a user.
 * Used to clear stale status notifications when the status transitions
 * (e.g. when approved, old "need more info" notifications become irrelevant).
 */
export async function markReadByTypes(
  userId: string,
  userKind: "internal" | "supplier",
  types: string[],
): Promise<void> {
  if (!types.length) return;
  await query(
    `UPDATE notifications SET is_read=true, read_at=now()
     WHERE user_id=$1 AND user_kind=$2 AND type=ANY($3) AND is_read=false`,
    [userId, userKind, types],
  );
}

export async function markReadByTypesSafe(
  userId: string,
  userKind: "internal" | "supplier",
  types: string[],
): Promise<void> {
  try {
    await markReadByTypes(userId, userKind, types);
  } catch {
    // best-effort
  }
}

/* ── mutations ───────────────────────────────────────────────────────────── */

export async function markRead(id: string, userId: string, userKind: "internal" | "supplier"): Promise<void> {
  await query(
    `UPDATE notifications SET is_read=true, read_at=now()
     WHERE id=$1 AND user_id=$2 AND user_kind=$3 AND is_read=false`,
    [id, userId, userKind],
  );
}

export async function markAllRead(userId: string, userKind: "internal" | "supplier"): Promise<void> {
  await query(
    `UPDATE notifications SET is_read=true, read_at=now()
     WHERE user_id=$1 AND user_kind=$2 AND is_read=false`,
    [userId, userKind],
  );
}
