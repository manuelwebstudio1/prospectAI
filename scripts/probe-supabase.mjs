import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
console.log("host", new URL(url).host);

const rest = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
});
console.log("rest_root", rest.status, (await rest.text()).slice(0, 200));

const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.from("subscription_plans").select("slug, name").limit(5);
console.log("plans", error ? `${error.code} ${error.message}` : JSON.stringify(data));
