import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { getPermissionsDB } from "@/lib/auth/rbac-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = await getPermissionsDB(session.role);

  return NextResponse.json({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    kind: session.kind,
    permissions,
  });
}
