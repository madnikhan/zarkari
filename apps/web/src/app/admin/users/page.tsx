import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.role !== "owner") redirect("/admin/dashboard");

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Users</h1>
      <p className="text-sm text-slate-500 mb-6">Manage staff and supplier accounts. Passwords are stored hashed when using the database.</p>
      <UsersManager />
    </div>
  );
}
