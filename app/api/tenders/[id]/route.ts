import { fail, ok } from "@/lib/api";
import { deleteTenderRecord, getTender, upsertTender } from "@/lib/repositories/procurehub";
import type { AdminTender } from "@/types/adminTender";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getTender(id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tender = (await request.json()) as AdminTender;
    return ok(await upsertTender({ ...tender, id }));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTenderRecord(id);
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
