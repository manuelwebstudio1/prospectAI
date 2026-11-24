import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearDevSession } from "@/lib/auth/dev-session";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  } else {
    await clearDevSession();
  }
  return NextResponse.json({ ok: true });
}
