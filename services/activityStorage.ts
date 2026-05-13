import { apiGet, apiPost } from "@/services/apiClient";
import type { InternalUser } from "@/types/internalUser";

const MAX_LOGS = 100;

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

export async function getAdminActivityLogs(): Promise<AdminActivityLog[]> {
  try {
    const logs = await apiGet<AdminActivityLog[]>("/api/activity-logs");
    return logs.slice(0, MAX_LOGS);
  } catch {
    return [];
  }
}

export async function addAdminActivityLog(input: AdminActivityLogInput): Promise<void> {
  const log: AdminActivityLog = {
    ...input,
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  await apiPost<AdminActivityLog>("/api/activity-logs", log).catch(() => undefined);
}

export async function clearAdminActivityLogs(): Promise<void> {
  // Not exposed by API yet; keeping the export for compatibility.
}

export function actorFromSession(
  session: InternalUser | null,
): { actorName?: string; actorRole?: string } {
  if (!session) return {};
  return {
    actorName: session.fullName ?? session.name ?? undefined,
    actorRole: session.role ?? undefined,
  };
}
