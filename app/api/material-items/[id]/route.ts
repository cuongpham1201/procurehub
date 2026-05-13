import { fail, ok } from "@/lib/api";
import { upsertMaterial } from "@/lib/repositories/procurehub";
import type { MaterialItem } from "@/types/category";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const material = (await request.json()) as MaterialItem;
    return ok(await upsertMaterial({ ...material, id }));
  } catch (error) {
    return fail(error);
  }
}
