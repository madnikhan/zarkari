import { NextResponse } from "next/server";
import { authenticate, SESSION_COOKIE_NAME, sessionCookieValue } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = authenticate(email, password);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookieValue(user), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return res;
}
