import { fail, ok } from "@/lib/api";
import { createActivityLog, listActivityLogs } from "@/lib/repositories/procurehub";
import type { AdminActivityLog } from "@/services/activityStorage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listActivityLogs());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const log = (await request.json()) as AdminActivityLog;
    return ok(await createActivityLog(log));
  } catch (error) {
    return fail(error);
  }
}
