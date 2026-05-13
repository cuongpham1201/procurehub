import { fail, ok } from "@/lib/api";
import { listCategories, upsertCategory } from "@/lib/repositories/procurehub";
import type { PurchaseCategory } from "@/types/category";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listCategories());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const category = (await request.json()) as PurchaseCategory;
    return ok(await upsertCategory(category));
  } catch (error) {
    return fail(error);
  }
}
