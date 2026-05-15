import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";
import { countUnread, listNotifications } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit      = Math.min(parseInt(searchParams.get("limit")  ?? "30", 10), 100);
  const offset     = Math.max(parseInt(searchParams.get("offset") ?? "0",  10), 0);
  const unreadOnly = searchParams.get("unread") === "true";

  const [items, unreadCount] = await Promise.all([
    listNotifications(session.sub, session.kind, { limit, offset, unreadOnly }),
    countUnread(session.sub, session.kind),
  ]);

  return NextResponse.json({ data: items, unreadCount });
}
