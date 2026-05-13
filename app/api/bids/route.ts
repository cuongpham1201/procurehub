import { fail, ok } from "@/lib/api";
import { listBids, upsertBid } from "@/lib/repositories/procurehub";
import type { SupplierBid } from "@/types/supplierBid";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listBids());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const bid = (await request.json()) as SupplierBid;
    return ok(await upsertBid(bid));
  } catch (error) {
    return fail(error);
  }
}
