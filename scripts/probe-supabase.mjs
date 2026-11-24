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

const health = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
});
console.log("auth_health", health.status);

const tables = [
  "profiles",
  "organizations",
  "subscription_plans",
  "campaigns",
  "leads",
  "generated_websites",
  "outreach_messages",
  "payment_transactions",
  "system_settings",
];

for (const table of tables) {
  const { error, count } = await supabase.from(table).select("*", { head: true, count: "exact" });
  if (error) {
    console.log(table, "ERROR", error.code ?? "", error.message.split("\n")[0].slice(0, 180));
  } else {
    console.log(table, "OK count=" + (count ?? 0));
  }
}
