import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");

  const members = isSupabaseConfigured()
    ? await loadMembers(user.organizationId)
    : [
        {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          role: "owner",
        },
      ];

  return (
    <div className="space-y-5 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team members</h1>
        <p className="text-sm text-muted-foreground">
          Seat lists come from organization membership. Invites are not sent unless Supabase Auth is connected.
        </p>
      </div>
      <div className="surface-card divide-y">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium">{member.full_name || member.email}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{member.role}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {isSupabaseConfigured()
          ? "Email invites are not wired in this pass. Add members in Supabase Auth / organization_members."
          : "Local labelled mode is a single-user workspace. Additional teammates are not invented."}
      </p>
    </div>
  );
}

async function loadMembers(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase
    ?.from("organization_members")
    .select("role, user_id, profiles(id, email, full_name)")
    .eq("organization_id", organizationId)) ?? { data: [] };
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: profile?.id ?? row.user_id,
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? "",
      role: row.role as string,
    };
  });
}
