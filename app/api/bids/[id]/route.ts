import { fail, ok } from "@/lib/api";
import { deleteBidRecord, getBid, upsertBid } from "@/lib/repositories/procurehub";
import type { SupplierBid } from "@/types/supplierBid";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getBid(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bid = (await request.json()) as SupplierBid;
    return ok(await upsertBid({ ...bid, id }));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBidRecord(id);
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
