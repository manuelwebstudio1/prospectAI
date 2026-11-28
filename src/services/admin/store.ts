import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import { applyPlatformRole } from "@/lib/auth/roles";
import { getPlan, SUBSCRIPTION_PLANS, type PlanSlug, type SubscriptionPlan } from "@/config/plans";
import type {
  ActivityLogRecord,
  AdminUserRecord,
  PlanOverride,
  PlatformSettings,
} from "@/services/workspace/types";
import type { CurrentUser } from "@/types";

export type AdminPlanMix = { slug: string; label: string; count: number };
export type AdminRecentUser = {
  id: string;
  email: string;
  full_name: string;
  organization_name: string | null;
  created_at: string;
};
export type AdminRecentPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  organization_name: string | null;
};

export type AdminOverviewStats = {
  users: number;
  organizations: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  mrrGhs: number;
  revenueGhs: number;
  paidPayments: number;
  campaigns: number;
  businesses: number;
  demos: number;
  failedJobs: number;
  planMix: AdminPlanMix[];
  recentUsers: AdminRecentUser[];
  recentPayments: AdminRecentPayment[];
  source: "local" | "supabase";
};

const emptyOverview = (source: "local" | "supabase"): AdminOverviewStats => ({
  users: 0,
  organizations: 0,
  activeSubscriptions: 0,
  trialSubscriptions: 0,
  mrrGhs: 0,
  revenueGhs: 0,
  paidPayments: 0,
  campaigns: 0,
  businesses: 0,
  demos: 0,
  failedJobs: 0,
  planMix: [],
  recentUsers: [],
  recentPayments: [],
  source,
});

async function adminClient() {
  return (await createSupabaseServiceClient()) ?? (await createSupabaseServerClient());
}

export async function getAdminOverview(): Promise<AdminOverviewStats> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    const plan = workspace.subscription ? getPlan((workspace.subscription.plan_slug as PlanSlug) || "starter") : null;
    const monthly =
      workspace.subscription?.status === "active" && plan
        ? workspace.subscription.billing_interval === "annual"
          ? Math.round(plan.annualGhs / 12)
          : plan.monthlyGhs
        : 0;
    const paid = (workspace.payments ?? []).filter((item) => item.status === "paid");
    return {
      ...emptyOverview("local"),
      users: 1,
      organizations: 1,
      activeSubscriptions: workspace.subscription?.status === "active" ? 1 : 0,
      trialSubscriptions: workspace.subscription?.status === "trialing" ? 1 : 0,
      mrrGhs: monthly,
      revenueGhs: paid.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
      paidPayments: paid.length,
      campaigns: (workspace.campaigns ?? []).length,
      businesses: (workspace.businesses ?? []).length,
      demos: (workspace.demos ?? []).length,
      failedJobs: (workspace.jobs ?? []).filter((job) => job.status === "failed").length,
      planMix: plan ? [{ slug: plan.slug, label: plan.name, count: 1 }] : [],
    };
  }
  const supabase = await adminClient();
  if (!supabase) return emptyOverview("supabase");

  const [
    users,
    orgs,
    subs,
    campaigns,
    businesses,
    demos,
    failedJobs,
    paidRows,
    recentProfiles,
    recentPayRows,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("status, billing_interval, subscription_plans(slug, name, price_monthly_ghs, price_annual_ghs)"),
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("generated_websites").select("id", { count: "exact", head: true }),
    supabase.from("campaign_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("payment_transactions").select("amount, status").eq("status", "paid"),
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at, organizations(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("payment_transactions")
      .select("id, amount, currency, status, created_at, organizations(name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const subRows = subs.data ?? [];
  const active = subRows.filter((row) => row.status === "active");
  const mrrGhs = active.reduce((sum, row) => {
    const plan = Array.isArray(row.subscription_plans) ? row.subscription_plans[0] : row.subscription_plans;
    if (!plan) return sum;
    const monthly = Number(plan.price_monthly_ghs ?? 0);
    const annual = Number(plan.price_annual_ghs ?? 0);
    return sum + (row.billing_interval === "annual" ? Math.round(annual / 12) : monthly);
  }, 0);
  const mixMap = new Map<string, AdminPlanMix>();
  for (const row of subRows) {
    const plan = Array.isArray(row.subscription_plans) ? row.subscription_plans[0] : row.subscription_plans;
    const slug = plan?.slug ?? "unknown";
    const current = mixMap.get(slug) ?? { slug, label: plan?.name ?? slug, count: 0 };
    current.count += 1;
    mixMap.set(slug, current);
  }

  return {
    users: users.count ?? 0,
    organizations: orgs.count ?? 0,
    activeSubscriptions: active.length,
    trialSubscriptions: subRows.filter((row) => row.status === "trialing").length,
    mrrGhs,
    revenueGhs: (paidRows.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    paidPayments: paidRows.data?.length ?? 0,
    campaigns: campaigns.count ?? 0,
    businesses: businesses.count ?? 0,
    demos: demos.count ?? 0,
    failedJobs: failedJobs.count ?? 0,
    planMix: [...mixMap.values()].sort((a, b) => b.count - a.count),
    recentUsers: (recentProfiles.data ?? []).map((row) => {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      return {
        id: String(row.id),
        email: String(row.email ?? ""),
        full_name: String(row.full_name ?? ""),
        organization_name: org?.name ?? null,
        created_at: String(row.created_at ?? ""),
      };
    }),
    recentPayments: (recentPayRows.data ?? []).map((row) => {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      return {
        id: String(row.id),
        amount: Number(row.amount ?? 0),
        currency: String(row.currency ?? "GHS"),
        status: String(row.status ?? ""),
        created_at: String(row.created_at ?? ""),
        organization_name: org?.name ?? null,
      };
    }),
    source: "supabase",
  };
}

export async function listAdminUsers(viewer: CurrentUser): Promise<AdminUserRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    const suspended = new Set(workspace.suspendedUserIds ?? []);
    return [
      {
        id: viewer.id,
        email: viewer.email,
        full_name: viewer.fullName,
        organization_id: viewer.organizationId,
        organization_name: viewer.organizationName,
        platform_role: viewer.platformRole,
        suspended_at: suspended.has(viewer.id) ? "suspended" : null,
        created_at: "local",
      },
    ];
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("profiles")
    .select("id, email, full_name, organization_id, platform_role, suspended_at, created_at, organizations(name)")
    .order("created_at", { ascending: false })
    .limit(200)) ?? { data: [] };
  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      id: row.id,
      email: row.email ?? "",
      full_name: row.full_name ?? "",
      organization_id: row.organization_id,
      organization_name: org?.name ?? null,
      platform_role: applyPlatformRole(row.platform_role, row.email ?? ""),
      suspended_at: row.suspended_at ?? null,
      created_at: row.created_at,
    };
  });
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.suspendedUserIds ??= [];
      if (suspended && !workspace.suspendedUserIds.includes(userId)) workspace.suspendedUserIds.push(userId);
      if (!suspended) workspace.suspendedUserIds = workspace.suspendedUserIds.filter((id) => id !== userId);
    });
    return;
  }
  const supabase = await adminClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function setUserPlatformRole(userId: string, role: AdminUserRecord["platform_role"]) {
  if (!isSupabaseConfigured()) {
    throw new Error("Local labelled sessions take platform role from PLATFORM_ADMIN_EMAILS, not from this form.");
  }
  const supabase = await adminClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("profiles").update({ platform_role: role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export const isUserSuspended = cache(async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.suspendedUserIds ?? []).includes(userId);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase
    ?.from("profiles")
    .select("suspended_at")
    .eq("id", userId)
    .maybeSingle()) ?? { data: null };
  return Boolean(data?.suspended_at);
});

export async function listAdminSubscriptions() {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    if (!workspace.subscription) return [];
    return [
      {
        organization_id: workspace.subscription.organization_id,
        organization_name: "My Workspace",
        plan_slug: workspace.subscription.plan_slug,
        status: workspace.subscription.status,
        billing_interval: workspace.subscription.billing_interval,
        current_period_end: workspace.subscription.current_period_end,
      },
    ];
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("subscriptions")
    .select("organization_id, status, billing_interval, current_period_end, organizations(name), subscription_plans(slug)")
    .order("updated_at", { ascending: false })
    .limit(200)) ?? { data: [] };
  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    const plan = Array.isArray(row.subscription_plans) ? row.subscription_plans[0] : row.subscription_plans;
    return {
      organization_id: row.organization_id,
      organization_name: org?.name ?? "Workspace",
      plan_slug: plan?.slug ?? "starter",
      status: row.status,
      billing_interval: row.billing_interval,
      current_period_end: row.current_period_end,
    };
  });
}

export async function listAdminJobs(): Promise<
  Array<{ id: string; job_type: string; status: string; last_error: string | null; created_at: string }>
> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return [...(workspace.jobs ?? [])]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 100)
      .map((job) => ({
        id: job.id,
        job_type: job.job_type,
        status: job.status,
        last_error: job.last_error,
        created_at: job.created_at,
      }));
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("campaign_jobs")
    .select("id, job_type, status, last_error, created_at")
    .order("created_at", { ascending: false })
    .limit(100)) ?? { data: [] };
  return (data ?? []).map((job) => ({
    id: String(job.id),
    job_type: String(job.job_type),
    status: String(job.status),
    last_error: (job.last_error as string | null) ?? null,
    created_at: String(job.created_at),
  }));
}

export async function listAiUsage() {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.aiUsage ?? [];
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("ai_usage_logs")
    .select("id, organization_id, agent, provider, model, created_at")
    .order("created_at", { ascending: false })
    .limit(100)) ?? { data: [] };
  return data ?? [];
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.platformSettings ?? { trial_days: 14, default_plan: "starter" };
  }
  const supabase = await adminClient();
  const { data } = (await supabase?.from("system_settings").select("key, value")) ?? { data: [] };
  const map = new Map((data ?? []).map((row) => [row.key, row.value]));
  return {
    trial_days: Number(map.get("trial_days") ?? 14),
    default_plan: String(map.get("default_plan") ?? "starter").replace(/"/g, ""),
  };
}

export async function savePlatformSettings(settings: PlatformSettings) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.platformSettings = settings;
    });
    return;
  }
  const supabase = await adminClient();
  if (!supabase) throw new Error("Database is not configured.");
  const trial = await supabase.from("system_settings").upsert({ key: "trial_days", value: settings.trial_days });
  if (trial.error) throw new Error(trial.error.message);
  const plan = await supabase.from("system_settings").upsert({ key: "default_plan", value: settings.default_plan });
  if (plan.error) throw new Error(plan.error.message);
}

export async function getRuntimePlans(): Promise<SubscriptionPlan[]> {
  const overrides = await loadPlanOverrides();
  return SUBSCRIPTION_PLANS.map((plan) => mergePlan(plan, overrides[plan.slug]));
}

export async function getRuntimePlan(slug: PlanSlug): Promise<SubscriptionPlan> {
  const plans = await getRuntimePlans();
  return plans.find((item) => item.slug === slug) ?? getPlan(slug);
}

async function loadPlanOverrides(): Promise<Partial<Record<string, PlanOverride>>> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.planOverrides ?? {};
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("subscription_plans")
    .select("slug, price_monthly_ghs, price_annual_ghs, discovery_credits, research_credits, website_generation_credits, outreach_credits, max_team_members, is_active")) ?? { data: [] };
  const map: Partial<Record<string, PlanOverride>> = {};
  for (const row of data ?? []) {
    map[row.slug] = {
      monthlyGhs: Number(row.price_monthly_ghs),
      annualGhs: Number(row.price_annual_ghs),
      discoveryCredits: row.discovery_credits,
      researchCredits: row.research_credits,
      websiteCredits: row.website_generation_credits,
      outreachCredits: row.outreach_credits,
      maxTeamMembers: row.max_team_members,
      isActive: row.is_active,
    };
  }
  return map;
}

export async function savePlanOverride(slug: PlanSlug, override: PlanOverride) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.planOverrides = { ...(workspace.planOverrides ?? {}), [slug]: override };
    });
    return;
  }
  const supabase = await adminClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase
    .from("subscription_plans")
    .update({
      price_monthly_ghs: override.monthlyGhs,
      price_annual_ghs: override.annualGhs,
      discovery_credits: override.discoveryCredits,
      research_credits: override.researchCredits,
      website_generation_credits: override.websiteCredits,
      outreach_credits: override.outreachCredits,
      max_team_members: override.maxTeamMembers,
      is_active: override.isActive ?? true,
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function listActivityLogs(): Promise<ActivityLogRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.activityLogs ?? []).slice(0, 100);
  }
  const supabase = await adminClient();
  const { data } = (await supabase
    ?.from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)) ?? { data: [] };
  return (data ?? []) as ActivityLogRecord[];
}

export async function recordActivity(entry: Omit<ActivityLogRecord, "id" | "created_at">) {
  const record: ActivityLogRecord = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.activityLogs = [record, ...(workspace.activityLogs ?? [])].slice(0, 200);
    });
    return;
  }
  const supabase = await adminClient();
  await supabase?.from("activity_logs").insert({
    organization_id: record.organization_id,
    actor_id: record.actor_id,
    entity_type: record.entity_type,
    entity_id: record.entity_id,
    action: record.action,
    metadata: record.metadata,
  });
}

function mergePlan(plan: SubscriptionPlan, override?: PlanOverride): SubscriptionPlan {
  if (!override) return plan;
  return {
    ...plan,
    monthlyGhs: override.monthlyGhs ?? plan.monthlyGhs,
    annualGhs: override.annualGhs ?? plan.annualGhs,
    discoveryCredits: override.discoveryCredits ?? plan.discoveryCredits,
    researchCredits: override.researchCredits ?? plan.researchCredits,
    websiteCredits: override.websiteCredits ?? plan.websiteCredits,
    outreachCredits: override.outreachCredits ?? plan.outreachCredits,
    maxTeamMembers: override.maxTeamMembers ?? plan.maxTeamMembers,
  };
}
