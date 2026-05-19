import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { resetSupplierPasswordByEmail } from "@/lib/repositories/procurehub";
import { emailSupplierForgotPassword } from "@/lib/email/service";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dauthau.zlab.io.vn";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Vui lòng nhập email" }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const supplier = await resetSupplierPasswordByEmail(email, hash);

  if (supplier) {
    void emailSupplierForgotPassword(
      email,
      supplier.companyName,
      tempPassword,
      `${APP_URL}/login`,
    );
  }

  // Always return success to prevent email enumeration
  return NextResponse.json({ ok: true });
}
