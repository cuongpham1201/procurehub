import { apiGet, apiPost } from "@/services/apiClient";
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogInput,
  ActivityLogListResponse,
} from "@/types/activityLog";

const DEFAULT_LIMIT = 50;

function toQueryString(filters: ActivityLogFilters = {}): string {
  const searchParams = new URLSearchParams();
  if (filters.entityType) searchParams.set("entityType", filters.entityType);
  if (filters.action) searchParams.set("action", filters.action);
  if (filters.search) searchParams.set("search", filters.search);
  if (filters.fromDate) searchParams.set("fromDate", filters.fromDate);
  if (filters.toDate) searchParams.set("toDate", filters.toDate);
  if (filters.limit) searchParams.set("limit", String(filters.limit));
  if (filters.offset) searchParams.set("offset", String(filters.offset));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<ActivityLogListResponse> {
  try {
    return await apiGet<ActivityLogListResponse>(`/api/activity-logs${toQueryString(filters)}`);
  } catch {
    return {
      items: [],
      total: 0,
      limit: filters.limit ?? DEFAULT_LIMIT,
      offset: filters.offset ?? 0,
    };
  }
}

export async function getAdminActivityLogs(limit = DEFAULT_LIMIT): Promise<ActivityLog[]> {
  const response = await getActivityLogs({ limit });
  return response.items;
}

export async function addAdminActivityLog(input: ActivityLogInput): Promise<void> {
  await apiPost<ActivityLog>("/api/activity-logs", input).catch(() => undefined);
}

export async function clearAdminActivityLogs(): Promise<void> {
  // Not exposed by API yet; keeping the export for compatibility.
}
