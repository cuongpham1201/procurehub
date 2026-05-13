import { fail, ok } from "@/lib/api";
import { listTenders, upsertTender } from "@/lib/repositories/procurehub";
import type { AdminTender } from "@/types/adminTender";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listTenders());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const tender = (await request.json()) as AdminTender;
    return ok(await upsertTender(tender));
  } catch (error) {
    return fail(error);
  }
}
