import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { getPermissionsDB } from "@/lib/auth/rbac-server";
import { getSupplierAuthFlags } from "@/lib/repositories/procurehub";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = await getPermissionsDB(session.role);

  let mustChangePassword = false;
  if (session.kind === "supplier") {
    const flags = await getSupplierAuthFlags(session.sub).catch(() => null);
    mustChangePassword = flags?.mustChangePassword ?? false;
  }

  return NextResponse.json({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    kind: session.kind,
    permissions,
    mustChangePassword,
  });
}
