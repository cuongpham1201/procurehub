import type { InternalUser } from "@/types/internalUser";

const ACTIVITY_KEY = "procurehub_admin_activity_logs";
const MAX_LOGS = 100;

// ── types ──────────────────────────────────────────────────────────────────

export type ActivityLogType =
  | "tender_status"
  | "bid_status"
  | "winner_selected"
  | "supplier_profile"
  | "bid_deleted"
  | "system";

export interface AdminActivityLog {
  id: string;
  type: ActivityLogType;
  title: string;
  description?: string;
  entityType?: "tender" | "bid" | "supplier" | "material";
  entityId?: string;
  entityCode?: string;
  actorName?: string;
  actorRole?: string;
  createdAt: string;
}

export type AdminActivityLogInput = Omit<AdminActivityLog, "id" | "createdAt">;

// ── storage helpers ────────────────────────────────────────────────────────

export function getAdminActivityLogs(): AdminActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const logs = raw ? (JSON.parse(raw) as AdminActivityLog[]) : [];
    return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function addAdminActivityLog(input: AdminActivityLogInput): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getAdminActivityLogs();
    const newLog: AdminActivityLog = {
      ...input,
      id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  } catch {
    // silently fail — activity logs are non-critical
  }
}

export function clearAdminActivityLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVITY_KEY);
}

// ── helper: extract actor info from internal session ──────────────────────

export function actorFromSession(
  session: InternalUser | null,
): { actorName?: string; actorRole?: string } {
  if (!session) return {};
  return {
    actorName: session.fullName ?? session.name ?? undefined,
    actorRole: session.role ?? undefined,
  };
}
