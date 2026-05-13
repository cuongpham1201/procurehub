import { fail, ok } from "@/lib/api";
import { getSupplier, upsertSupplier } from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getSupplier(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = (await request.json()) as SupplierAccount;
    return ok(await upsertSupplier({ ...supplier, id }));
  } catch (error) {
    return fail(error);
  }
}
