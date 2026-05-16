import { fail, ok, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import { deleteAwardItem } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();
    const { id } = await params;
    await deleteAwardItem(id);
    return ok(true);
  } catch (error) {
    return fail(error);
  }
}
