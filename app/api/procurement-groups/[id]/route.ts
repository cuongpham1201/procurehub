import { fail, ok } from "@/lib/api";
import { upsertCategory } from "@/lib/repositories/procurehub";
import type { PurchaseCategory } from "@/types/category";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = (await request.json()) as PurchaseCategory;
    return ok(await upsertCategory({ ...category, id }));
  } catch (error) {
    return fail(error);
  }
}
