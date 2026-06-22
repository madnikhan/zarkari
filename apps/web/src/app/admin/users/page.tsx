import { demoUsers } from "@/lib/data/seed";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.role !== "owner") redirect("/admin/dashboard");

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Users</h1>
      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {demoUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs bg-[#F4F3FF] text-[#4C3BCF] capitalize">{user.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-4">Demo passwords: demo123 for all accounts.</p>
    </div>
  );
}
