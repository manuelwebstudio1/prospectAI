import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type WorkspaceProvisionInput = {
  userId: string;
  email?: string | null;
  fullName: string;
  companyName?: string | null;
  country?: string | null;
  businessType?: string | null;
  primaryIndustry?: string | null;
  intendedUse?: string | null;
};

function workspaceName(input: WorkspaceProvisionInput) {
  const named = input.companyName?.trim();
  if (named && named.length >= 2) return named.slice(0, 80);
  const first = input.fullName.trim().split(/\s+/)[0] || "My";
  return `${first}'s workspace`;
}

async function db() {
  return (await createSupabaseServiceClient()) ?? (await createSupabaseServerClient());
}

export async function ensureCustomerWorkspace(
  input: WorkspaceProvisionInput,
): Promise<{ organizationId?: string; error?: string }> {
  const supabase = await db();
  if (!supabase) return { error: "Database is not configured." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, onboarding_completed")
    .eq("id", input.userId)
    .maybeSingle();

  const companyName = workspaceName(input);
  const country = input.country?.trim() || "GH";

  if (profile?.organization_id) {
    await supabase
      .from("organizations")
      .update({
        ...(input.companyName?.trim() ? { name: companyName } : {}),
        ...(input.country ? { country } : {}),
        ...(input.businessType ? { business_type: input.businessType } : {}),
        ...(input.primaryIndustry ? { primary_industry: input.primaryIndustry } : {}),
        ...(input.intendedUse ? { intended_use: input.intendedUse } : {}),
      })
      .eq("id", profile.organization_id);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: input.fullName,
        email: input.email ?? undefined,
        organization_id: profile.organization_id,
        country,
        onboarding_completed: true,
      })
      .eq("id", input.userId);

    if (profileError) return { error: profileError.message };
    return { organizationId: profile.organization_id };
  }

  const organizationId = crypto.randomUUID();
  const slug = `${slugify(companyName) || "workspace"}-${input.userId.replace(/-/g, "").slice(0, 8)}`;

  const { error: orgError } = await supabase.from("organizations").insert({
    id: organizationId,
    name: companyName,
    slug,
    country,
    business_type: input.businessType ?? "other",
    primary_industry: input.primaryIndustry ?? null,
    intended_use: input.intendedUse ?? "Find businesses without websites and win clients.",
  });
  if (orgError) return { error: orgError.message };

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: input.userId,
    role: "owner",
  });
  if (memberError && !/duplicate|unique/i.test(memberError.message)) {
    return { error: memberError.message };
  }

  const { data: starter } = await supabase
    .from("subscription_plans")
    .select("id, discovery_credits, research_credits, website_generation_credits, outreach_credits")
    .eq("slug", "starter")
    .maybeSingle();

  if (starter) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 14);
    await supabase.from("subscriptions").insert({
      organization_id: organizationId,
      plan_id: starter.id,
      status: "trialing",
      trial_ends_at: periodEnd.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
    await supabase.from("credit_balances").insert([
      {
        organization_id: organizationId,
        credit_type: "discovery",
        remaining: starter.discovery_credits,
        allocated: starter.discovery_credits,
      },
      {
        organization_id: organizationId,
        credit_type: "research",
        remaining: starter.research_credits,
        allocated: starter.research_credits,
      },
      {
        organization_id: organizationId,
        credit_type: "website_generation",
        remaining: starter.website_generation_credits,
        allocated: starter.website_generation_credits,
      },
      {
        organization_id: organizationId,
        credit_type: "outreach",
        remaining: starter.outreach_credits,
        allocated: starter.outreach_credits,
      },
    ]);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: input.userId,
    email: input.email ?? null,
    full_name: input.fullName,
    organization_id: organizationId,
    country,
    onboarding_completed: true,
    platform_role: "user",
  });
  if (profileError) return { error: profileError.message };

  return { organizationId };
}
