import { fail, ok } from "@/lib/api";
import { listSuppliers, upsertSupplier } from "@/lib/repositories/procurehub";
import type { SupplierAccount } from "@/types/supplierAccount";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listSuppliers());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const supplier = (await request.json()) as SupplierAccount;
    return ok(await upsertSupplier(supplier));
  } catch (error) {
    return fail(error);
  }
}
