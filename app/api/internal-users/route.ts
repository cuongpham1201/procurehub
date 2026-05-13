import { fail, ok } from "@/lib/api";
import { listInternalUsers, upsertInternalUser } from "@/lib/repositories/procurehub";
import type { InternalUser } from "@/types/internalUser";

export const dynamic = "force-dynamic";

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
    return ok(await upsertInternalUser(user));
  } catch (error) {
    return fail(error);
  }
}
