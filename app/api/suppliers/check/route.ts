// Endpoint công khai — kiểm tra trùng lặp khi đăng ký supplier.
// Chỉ trả về boolean, KHÔNG trả về dữ liệu supplier.
import { fail, ok } from "@/lib/api";
import { checkSupplierDuplicates } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email     = searchParams.get("email")     ?? undefined;
    const taxCode   = searchParams.get("taxCode")   ?? undefined;
    const phone     = searchParams.get("phone")     ?? undefined;
    const excludeId = searchParams.get("excludeId") ?? undefined;

    const result = await checkSupplierDuplicates({ email, taxCode, phone, excludeId });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
