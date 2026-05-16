import { fail, ok, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import { createActivityLog, listActivityLogs } from "@/lib/repositories/procurehub";
import type { ActivityLog, ActivityLogFilters, ActivityLogInput } from "@/types/activityLog";
import { logActivity } from "@/lib/activity-log";
import type { ActivityAction, ActivityEntityType } from "@/types/activityLog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    const { searchParams } = new URL(request.url);
    const filters: ActivityLogFilters = {
      entityType: (searchParams.get("entityType") ?? "") as ActivityEntityType | "",
      action: (searchParams.get("action") ?? "") as ActivityAction | "",
      search: searchParams.get("search") ?? "",
      fromDate: searchParams.get("fromDate") ?? "",
      toDate: searchParams.get("toDate") ?? "",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    };
    return ok(await listActivityLogs(filters));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    const input = (await request.json()) as ActivityLogInput | ActivityLog;
    if ("id" in input && "createdAt" in input) {
      return ok(await createActivityLog(input as ActivityLog));
    }
    return ok(await logActivity(input as ActivityLogInput));
  } catch (error) {
    return fail(error);
  }
}
