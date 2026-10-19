import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getR2EnvStatus } from "@/lib/storage/r2-env-status";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = await getR2EnvStatus();
  return NextResponse.json({
    env,
    docsPath: "/docs/r2-cors-setup.md",
    corsPolicyHint: {
      allowedOrigins: [
        "https://www.zarkari.co.uk",
        "https://zarkari.co.uk",
        "http://localhost:3000",
      ],
      exposeHeaders: ["ETag"],
    },
  });
}
