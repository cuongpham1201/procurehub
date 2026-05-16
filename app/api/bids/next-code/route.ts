import { fail, ok, unauthorized } from "@/lib/api";
import { getServerSession } from "@/lib/auth/server";
import { nextBidCode } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

// Chỉ supplier đã đăng nhập mới được tạo mã báo giá mới
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return unauthorized();
    if (session.kind !== "supplier") return unauthorized("Chỉ nhà cung cấp mới được tạo mã báo giá");
    const code = await nextBidCode();
    return ok(code);
  } catch (error) {
    return fail(error);
  }
}
