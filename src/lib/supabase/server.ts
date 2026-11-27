import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getActor } from "@/lib/auth/actor-context";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const actor = getActor();
  if (actor?.privileged) {
    return createSupabaseServiceClient();
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component; middleware will refresh the session.
        }
      },
    },
  });
}

export async function createSupabaseServiceClient() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) return null;

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
