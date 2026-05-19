import { NextRequest, NextResponse } from "next/server";
import { verifySupplierEmail } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return NextResponse.redirect(new URL("/supplier/verify-email?error=missing_token", req.url));
  }

  const supplierId = await verifySupplierEmail(token).catch(() => null);
  if (!supplierId) {
    return NextResponse.redirect(new URL("/supplier/verify-email?error=invalid_token", req.url));
  }

  return NextResponse.redirect(new URL("/supplier/verify-email?success=1", req.url));
}
