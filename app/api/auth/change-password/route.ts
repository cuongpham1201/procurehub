import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getServerSession } from "@/lib/auth/server";
import { markPasswordChanged } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.kind !== "supplier" && session.kind !== "internal") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword?.trim()) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu hiện tại" }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Mật khẩu mới tối thiểu 8 ký tự" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại" }, { status: 400 });
  }

  const table = session.kind === "supplier" ? "suppliers" : "internal_users";

  // Fetch current hash
  const res = await query<{ password: string | null; password_hash: string | null }>(
    `SELECT password, password_hash FROM ${table} WHERE id = $1`,
    [session.sub],
  );
  const row = res.rows[0];
  if (!row) {
    return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
  }

  // Verify current password
  let valid = false;
  if (row.password_hash) {
    valid = await verifyPassword(currentPassword, row.password_hash);
  } else if (row.password) {
    valid = row.password === currentPassword;
  }
  if (!valid) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);

  if (session.kind === "supplier") {
    await markPasswordChanged(session.sub, newHash);
  } else {
    await query(
      "UPDATE internal_users SET password_hash = $1, password = NULL WHERE id = $2",
      [newHash, session.sub],
    );
  }

  // Suppress unused-var — cookies() must be called to finalize the response in Next.js App Router
  void (await cookies());

  return NextResponse.json({ ok: true });
}
