import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { applyPlatformRole, isPlatformAdmin } from "@/lib/auth/roles";
import { getDevSession } from "@/lib/auth/dev-session";
import type { CurrentUser } from "@/types";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) {
    return getDevSession();
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, organization_id, onboarding_completed, platform_role, organizations(name)",
    )
    .eq("id", user.id)
    .maybeSingle();

  const organization = Array.isArray(profile?.organizations)
    ? profile?.organizations[0]
    : profile?.organizations;

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName:
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "there",
    avatarUrl: profile?.avatar_url ?? null,
    organizationId: profile?.organization_id ?? null,
    organizationName: organization?.name ?? null,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
    platformRole: applyPlatformRole(
      (profile?.platform_role as CurrentUser["platformRole"]) ?? "user",
      profile?.email ?? user.email ?? "",
    ),
    isSample: false,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requirePlatformAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isPlatformAdmin(user)) redirect("/dashboard");
  return user;
}
