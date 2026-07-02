import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionCookie } from "@/lib/auth/signed-session";

export async function middleware(request: NextRequest) {
  const sessionRaw = request.cookies.get("zarkari-session")?.value;
  const path = request.nextUrl.pathname;
  const user = sessionRaw ? await parseSessionCookie(sessionRaw) : null;

  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!user) return NextResponse.redirect(new URL("/login?redirect=/admin/dashboard", request.url));
    const isInbox = path.startsWith("/admin/inbox");
    if (!isInbox && user.role !== "owner" && user.role !== "staff") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (path.startsWith("/admin/finance") && user.role !== "owner") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (path.startsWith("/admin/cash/analytics") && user.role !== "owner") {
      return NextResponse.redirect(new URL("/admin/cash", request.url));
    }
    if (path.startsWith("/admin/users") && user.role !== "owner") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (path.startsWith("/supplier")) {
    if (!user) return NextResponse.redirect(new URL("/login?redirect=/supplier", request.url));
    if (user.role !== "supplier") return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*"],
};
