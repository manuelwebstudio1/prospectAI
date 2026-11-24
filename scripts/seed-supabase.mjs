import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function probe(label, query) {
  const { error } = await query;
  if (error) console.log(label, "ERROR", error.code ?? "", error.message.split("\n")[0].slice(0, 180));
  else console.log(label, "OK");
}

await probe("profiles.suspended_at", supabase.from("profiles").select("suspended_at").limit(1));
await probe("outreach.metadata", supabase.from("outreach_messages").select("metadata").limit(1));
await probe(
  "payments.moolre",
  supabase.from("payment_transactions").select("external_ref, plan_slug, checkout_url").limit(1),
);
await probe("webhook_events", supabase.from("webhook_events").select("event_id").limit(1));
await probe("subscriptions.moolre_external_ref", supabase.from("subscriptions").select("moolre_external_ref").limit(1));

const plans = [
  {
    slug: "starter",
    name: "Starter",
    price_monthly_ghs: 150,
    price_annual_ghs: 1500,
    discovery_credits: 250,
    research_credits: 100,
    website_generation_credits: 10,
    outreach_credits: 50,
    max_team_members: 1,
    is_active: true,
    features: [
      "Limited business discoveries",
      "Website detection",
      "AI business research",
      "Limited demo generation",
      "Basic lead management",
    ],
  },
  {
    slug: "professional",
    name: "Professional",
    price_monthly_ghs: 350,
    price_annual_ghs: 3500,
    discovery_credits: 10000,
    research_credits: 2000,
    website_generation_credits: -1,
    outreach_credits: 1000,
    max_team_members: 5,
    is_active: true,
    features: [
      "Increased discovery limits",
      "Unlimited demo generation",
      "Advanced AI research",
      "AI outreach assistance",
      "Campaign management",
      "Analytics",
    ],
  },
  {
    slug: "agency",
    name: "Agency",
    price_monthly_ghs: 700,
    price_annual_ghs: 7000,
    discovery_credits: 40000,
    research_credits: 8000,
    website_generation_credits: -1,
    outreach_credits: 5000,
    max_team_members: 25,
    is_active: true,
    features: [
      "Higher usage limits",
      "Team collaboration",
      "Advanced analytics",
      "Priority processing",
      "Increased AI usage",
    ],
  },
];

const planResult = await supabase.from("subscription_plans").upsert(plans, { onConflict: "slug" });
if (planResult.error) {
  console.log("seed_plans ERROR", planResult.error.message);
} else {
  console.log("seed_plans OK");
}

const settings = await supabase.from("system_settings").upsert(
  [
    { key: "trial_days", value: 14 },
    { key: "default_plan", value: "starter" },
  ],
  { onConflict: "key" },
);
if (settings.error) console.log("seed_settings ERROR", settings.error.message);
else console.log("seed_settings OK");

const { count: planCount } = await supabase.from("subscription_plans").select("*", { head: true, count: "exact" });
const { count: settingCount } = await supabase.from("system_settings").select("*", { head: true, count: "exact" });
console.log("subscription_plans", planCount);
console.log("system_settings", settingCount);
