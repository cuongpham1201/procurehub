import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface LoginBody {
  email: string;
  password: string;
  kind?: "internal" | "supplier";
}

interface UserRow {
  id: string;
  full_name: string;
  company_name: string;
  email: string | null;
  role: string | null;
  status: string | null;
  password: string | null;
  password_hash: string | null;
}

export async function POST(req: NextRequest) {
  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, kind = "internal" } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email và mật khẩu không được để trống" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (kind === "internal") {
    const result = await query<UserRow>(
      "SELECT id, full_name, email, role, status, password, password_hash FROM internal_users WHERE lower(email) = $1 LIMIT 1",
      [normalizedEmail],
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (user.status === "inactive" || user.status === "Tạm khóa") {
      return NextResponse.json({ error: "Tài khoản đã bị khóa" }, { status: 403 });
    }

    const valid = await checkAndUpgradePassword(
      password,
      user,
      "internal_users",
    );
    if (!valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const token = await signSession({
      sub: user.id,
      kind: "internal",
      role: user.role ?? "Chỉ xem",
      name: user.full_name,
      email: user.email ?? null,
    });

    const cookieStore = await cookies();
    setSessionCookie(cookieStore, token);

    return NextResponse.json({
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      kind: "internal",
    });
  }

  if (kind === "supplier") {
    const result = await query<UserRow>(
      "SELECT id, company_name, email, status, password, password_hash FROM suppliers WHERE lower(email) = $1 LIMIT 1",
      [normalizedEmail],
    );

    const supplier = result.rows[0];
    if (!supplier) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    if (supplier.status === "Tạm khóa" || supplier.status === "Từ chối") {
      return NextResponse.json({ error: "Tài khoản nhà cung cấp không được phép truy cập" }, { status: 403 });
    }

    const valid = await checkAndUpgradePassword(
      password,
      supplier,
      "suppliers",
    );
    if (!valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const token = await signSession({
      sub: supplier.id,
      kind: "supplier",
      role: "supplier",
      name: supplier.company_name,
      email: supplier.email ?? null,
    });

    const cookieStore = await cookies();
    setSessionCookie(cookieStore, token);

    return NextResponse.json({
      id: supplier.id,
      name: supplier.company_name,
      email: supplier.email,
      role: "supplier",
      kind: "supplier",
    });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}

async function checkAndUpgradePassword(
  plain: string,
  row: { id: string; password: string | null; password_hash: string | null },
  table: "internal_users" | "suppliers",
): Promise<boolean> {
  if (row.password_hash) {
    return verifyPassword(plain, row.password_hash);
  }

  // Plain text still in DB — verify then auto-upgrade
  if (row.password === plain) {
    const hash = await hashPassword(plain);
    await query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`, [hash, row.id]);
    return true;
  }

  return false;
}
