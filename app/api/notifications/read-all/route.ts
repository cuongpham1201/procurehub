import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { markAllRead } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markAllRead(session.sub, session.kind);
  return NextResponse.json({ ok: true });
}
