import { getSession } from "@/lib/auth/session";

export async function requireUploadSession() {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return null;
  }
  return session;
}
