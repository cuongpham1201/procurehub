import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

const INTERNAL_ROUTES = [/^\/admin(\/|$)/];
const SUPPLIER_ROUTES = [
  /^\/supplier\/dashboard(\/|$)/,
  /^\/supplier\/profile(\/|$)/,
  /^\/supplier\/bids(\/|$)/,
  /^\/supplier\/submit-bid(\/|$)/,
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isInternalRoute = INTERNAL_ROUTES.some((r) => r.test(pathname));
  const isSupplierRoute = SUPPLIER_ROUTES.some((r) => r.test(pathname));

  if (!isInternalRoute && !isSupplierRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (isInternalRoute) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.kind !== "internal") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "forbidden");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isSupplierRoute) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.kind !== "supplier") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "forbidden");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supplier/dashboard/:path*",
    "/supplier/profile/:path*",
    "/supplier/bids/:path*",
    "/supplier/submit-bid/:path*",
  ],
};
