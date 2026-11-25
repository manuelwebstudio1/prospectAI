"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validation/auth";
import { DEV_USER, setDevSession } from "@/lib/auth/dev-session";
import { applyPlatformRole, isPlatformAdmin } from "@/lib/auth/roles";
import { ensureCustomerWorkspace } from "@/services/workspace/provision";

export type ActionState = { error?: string; success?: string } | null;

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  if (!isSupabaseConfigured()) {
    const role = applyPlatformRole("user", parsed.data.email);
    await setDevSession({
      ...DEV_USER,
      email: parsed.data.email,
      fullName: parsed.data.email.split("@")[0].replace(/\./g, " "),
      platformRole: role,
    });
    redirect(isPlatformAdmin({ platformRole: role }) ? "/admin" : "/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is not configured." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Could not start your session." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role, email, full_name, onboarding_completed, organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const role = applyPlatformRole(profile?.platform_role, profile?.email ?? parsed.data.email);
  if (isPlatformAdmin({ platformRole: role })) redirect("/admin");

  const provisioned = await ensureCustomerWorkspace({
    userId: user.id,
    email: profile?.email ?? user.email,
    fullName:
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      parsed.data.email.split("@")[0],
  });
  if (provisioned.error) return { error: provisioned.error };
  redirect("/dashboard");
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: String(formData.get("companyName") ?? "").trim() || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  if (!isSupabaseConfigured()) {
    await setDevSession({
      ...DEV_USER,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      organizationName: parsed.data.companyName?.trim() || `${parsed.data.fullName.split(" ")[0]}'s workspace`,
      onboardingCompleted: true,
    });
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is not configured." };

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName ?? "",
      },
      emailRedirectTo: `${origin}/dashboard`,
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    const admin = await createSupabaseServiceClient();
    if (data.user && admin) {
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true });
    }
    const signedIn = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signedIn.error || !signedIn.data.user) {
      return {
        error: "Account created. Confirm your email, then log in to open your workspace.",
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Account created, but the session did not start. Please log in." };

  const provisioned = await ensureCustomerWorkspace({
    userId: user.id,
    email: user.email,
    fullName: parsed.data.fullName,
    companyName: parsed.data.companyName,
  });
  if (provisioned.error) return { error: provisioned.error };

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (!isSupabaseConfigured()) {
    return {
      success:
        "Development mode: password reset requires Supabase Auth. Add NEXT_PUBLIC_SUPABASE_URL to enable email recovery.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is not configured." };

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/login`,
  });
  if (error) return { error: error.message };

  return { success: "If an account exists, a reset link is on its way." };
}

export async function completeOnboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    fullName: String(formData.get("fullName") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    country: String(formData.get("country") ?? ""),
    businessType: String(formData.get("businessType") ?? ""),
    primaryIndustry: String(formData.get("primaryIndustry") ?? ""),
    intendedUse: String(formData.get("intendedUse") ?? ""),
  };

  if (payload.fullName.length < 2 || payload.companyName.length < 2) {
    return { error: "Name and company are required." };
  }

  if (!isSupabaseConfigured()) {
    await setDevSession({
      ...DEV_USER,
      fullName: payload.fullName,
      organizationName: payload.companyName,
      onboardingCompleted: true,
    });
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Database is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const provisioned = await ensureCustomerWorkspace({
    userId: user.id,
    email: user.email,
    ...payload,
  });
  if (provisioned.error) return { error: provisioned.error };

  redirect("/dashboard");
}
