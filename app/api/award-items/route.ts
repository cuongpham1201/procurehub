import { fail, ok, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import { listAwardItems, upsertAwardItem } from "@/lib/repositories/procurehub";
import type { UpsertAwardItemInput } from "@/types/awardItem";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    const tenderId = new URL(request.url).searchParams.get("tenderId");
    if (!tenderId) return fail(new Error("tenderId required"), 400);
    return ok(await listAwardItems(tenderId));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    const input = (await request.json()) as UpsertAwardItemInput;
    if (!input.tenderId || !input.tenderItemId || !input.bidId) {
      return fail(new Error("tenderId, tenderItemId, bidId required"), 400);
    }
    return ok(await upsertAwardItem(input));
  } catch (error) {
    return fail(error);
  }
}
