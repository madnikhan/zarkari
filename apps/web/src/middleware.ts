import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("zarkari-session")?.value;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!session) return NextResponse.redirect(new URL("/login?redirect=/admin/dashboard", request.url));
    try {
      const user = JSON.parse(session);
      if (user.role !== "owner" && user.role !== "staff") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (path.startsWith("/admin/finance") && user.role !== "owner") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/supplier")) {
    if (!session) return NextResponse.redirect(new URL("/login?redirect=/supplier", request.url));
    try {
      const user = JSON.parse(session);
      if (user.role !== "supplier") return NextResponse.redirect(new URL("/login", request.url));
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*"],
};
