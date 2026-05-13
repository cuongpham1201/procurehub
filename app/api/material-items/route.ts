import { fail, ok } from "@/lib/api";
import { listMaterials, upsertMaterial } from "@/lib/repositories/procurehub";
import type { MaterialItem } from "@/types/category";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listMaterials());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const material = (await request.json()) as MaterialItem;
    return ok(await upsertMaterial(material));
  } catch (error) {
    return fail(error);
  }
}
