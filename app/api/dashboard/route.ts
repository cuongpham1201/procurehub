import { fail, ok, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import {
  getDashboardStats,
  getMonthlyTrends,
  listActivityLogs,
} from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.kind !== "internal") return unauthorized();

    const [stats, trends, logsResult] = await Promise.all([
      getDashboardStats(),
      getMonthlyTrends(),
      listActivityLogs({ limit: 20 }),
    ]);

    return ok({ stats, trends, activities: logsResult.items });
  } catch (error) {
    return fail(error);
  }
}
