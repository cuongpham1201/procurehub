import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  clearSessionCookie(cookieStore);
  return NextResponse.json({ ok: true });
}
