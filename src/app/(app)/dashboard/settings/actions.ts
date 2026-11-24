"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { setDevSession } from "@/lib/auth/dev-session";

export type SettingsState = { error?: string; success?: string } | null;

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  if (fullName.length < 2) return { error: "Enter your name." };

  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  if (!isSupabaseConfigured()) {
    await setDevSession({
      ...user,
      fullName,
      organizationName: organizationName || user.organizationName,
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: "Saved to the local development session." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Database is not configured." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (user.organizationId && organizationName) {
    await supabase
      .from("organizations")
      .update({ name: organizationName })
      .eq("id", user.organizationId);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}
