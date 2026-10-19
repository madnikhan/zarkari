import { NextResponse } from "next/server";
import { authenticate, SESSION_COOKIE_NAME, sessionCookieOptions, sessionCookieValue } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { ensureDemoLoginUsersDb, isDemoLoginEmail } from "@/lib/db/users";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const emailStr = typeof email === "string" ? email : "";

  // README demo emails may be missing from Neon — create/repair them on first login attempt.
  if (isDbConfigured() && isDemoLoginEmail(emailStr)) {
    try {
      await ensureDemoLoginUsersDb();
    } catch (err) {
      console.error("ensureDemoLoginUsersDb failed:", err);
    }
  }

  const user = await authenticate(emailStr, typeof password === "string" ? password : "");
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE_NAME, await sessionCookieValue(user), sessionCookieOptions());
  return res;
}
