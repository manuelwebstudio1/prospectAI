import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("missing-supabase");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now();
const email = `workspace.flow.${stamp}@prospectai.test`;
const password = "TestUser123A";
const fullName = "Ama Mensah";

const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (created.error || !created.data.user) {
  console.error("create-user-failed", created.error?.message);
  process.exit(1);
}

const userId = created.data.user.id;
const organizationId = crypto.randomUUID();
const slug = `amas-workspace-${userId.replace(/-/g, "").slice(0, 8)}`;

const org = await admin.from("organizations").insert({
  id: organizationId,
  name: "Ama's workspace",
  slug,
  country: "GH",
  business_type: "other",
});
if (org.error) {
  console.error("org-failed", org.error.message);
  await admin.auth.admin.deleteUser(userId);
  process.exit(1);
}

await admin
  .from("profiles")
  .update({
    full_name: fullName,
    organization_id: organizationId,
    country: "GH",
    onboarding_completed: true,
  })
  .eq("id", userId);

await admin.from("organization_members").insert({
  organization_id: organizationId,
  user_id: userId,
  role: "owner",
});

const { data: starter } = await admin
  .from("subscription_plans")
  .select("id")
  .eq("slug", "starter")
  .maybeSingle();
if (starter) {
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 14);
  await admin.from("subscriptions").insert({
    organization_id: organizationId,
    plan_id: starter.id,
    status: "trialing",
    trial_ends_at: periodEnd.toISOString(),
    current_period_end: periodEnd.toISOString(),
  });
}

const { data: profile } = await admin
  .from("profiles")
  .select("onboarding_completed, organization_id")
  .eq("id", userId)
  .maybeSingle();

console.log(
  JSON.stringify({
    ok: Boolean(profile?.onboarding_completed && profile.organization_id),
    hasOrg: Boolean(profile?.organization_id),
    onboarded: Boolean(profile?.onboarding_completed),
  }),
);

await admin.from("organization_members").delete().eq("user_id", userId);
await admin.from("subscriptions").delete().eq("organization_id", organizationId);
await admin.from("credit_balances").delete().eq("organization_id", organizationId);
await admin.from("profiles").update({ organization_id: null }).eq("id", userId);
await admin.from("organizations").delete().eq("id", organizationId);
await admin.auth.admin.deleteUser(userId);
