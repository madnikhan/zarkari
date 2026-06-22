import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fileName, contentType, category } = body as { fileName?: string; contentType?: string; category?: string };

  const r2Configured =
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    !process.env.R2_ACCESS_KEY_ID.includes("placeholder");

  if (!r2Configured) {
    const demoUrl = body.url ?? "/catalog/guldaan/1.png";
    return NextResponse.json({
      demo: true,
      url: demoUrl,
      fileName: fileName ?? "upload.jpg",
      category: category ?? "general",
    });
  }

  const key = `uploads/${category ?? "general"}/${Date.now()}-${fileName ?? "file"}`;
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({
    uploadUrl: publicUrl,
    url: publicUrl,
    key,
    contentType: contentType ?? "image/jpeg",
  });
}
