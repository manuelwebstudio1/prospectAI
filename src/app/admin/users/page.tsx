import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { listAdminUsers } from "@/services/admin/store";
import { RoleForm, SuspendButton } from "@/components/admin/admin-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Admin users" };

export default async function AdminUsersPage() {
  const admin = await requirePlatformAdmin();
  const users = await listAdminUsers(admin);

  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {isSupabaseConfigured()
            ? "Profiles from the database. Role changes require a platform_role write policy or service role."
            : "Local mode only has the labelled development session. Extra users are not invented."}
        </p>
      </div>
      <div className="overflow-x-auto surface-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3">{user.organization_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <RoleForm userId={user.id} role={user.platform_role} />
                </td>
                <td className="px-4 py-3">{user.suspended_at ? "Suspended" : "Active"}</td>
                <td className="px-4 py-3">
                  <SuspendButton userId={user.id} suspended={Boolean(user.suspended_at)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
