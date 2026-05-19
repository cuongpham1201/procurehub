import { NextRequest, NextResponse } from "next/server";
import { verifySupplierEmail } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dauthau.zlab.io.vn";

function redirect(path: string) {
  return NextResponse.redirect(`${APP_URL}${path}`);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return redirect("/supplier/verify-email?error=missing_token");
  }

  const supplierId = await verifySupplierEmail(token).catch(() => null);
  if (!supplierId) {
    return redirect("/supplier/verify-email?error=invalid_token");
  }

  return redirect("/supplier/verify-email?success=1");
}
