import { fail, ok } from "@/lib/api";
import {
  describeActivity,
  getActorFromRequest,
  logActivitySafe,
  snapshot,
} from "@/lib/activity-log";
import { getInternalUser, listInternalUsers, upsertInternalUser } from "@/lib/repositories/procurehub";
import type { InternalUser } from "@/types/internalUser";
import type { ActivityAction } from "@/types/activityLog";

export const dynamic = "force-dynamic";

function resolveUserAction(previous: InternalUser | null, current: InternalUser): ActivityAction {
  if (!previous) return "created";
  if (previous.role !== current.role) return "role_changed";
  if (previous.status !== current.status && current.status === "Tạm khóa") return "deactivated";
  return "updated";
}

export async function GET() {
  try {
    return ok(await listInternalUsers());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = (await request.json()) as InternalUser;
    const previous = user.id ? await getInternalUser(user.id) : null;
    const saved = await upsertInternalUser(user);
    const action = resolveUserAction(previous, saved);
    await logActivitySafe({
      ...getActorFromRequest(request),
      entityType: "user",
      entityId: saved.id,
      entityName: saved.fullName,
      action,
      description: describeActivity("user", action, saved.fullName),
      metadata: {
        email: saved.email,
        role: saved.role,
        department: saved.department,
        status: saved.status,
      },
      oldValues: snapshot(previous ? { ...previous, password: undefined } : null),
      newValues: snapshot({ ...saved, password: undefined }),
    });
    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
