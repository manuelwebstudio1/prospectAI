"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validation/auth";
import { DEV_USER, setDevSession } from "@/lib/auth/dev-session";
import { slugify } from "@/lib/utils";

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
    await setDevSession({
      ...DEV_USER,
      email: parsed.data.email,
      fullName: parsed.data.email.split("@")[0].replace(/\./g, " "),
    });
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is not configured." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
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
      onboardingCompleted: false,
    });
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is not configured." };

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/dashboard`,
    },
  });
  if (error) return { error: error.message };

  redirect("/onboarding");
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

  const organizationId = crypto.randomUUID();
  const { error: orgError } = await supabase.from("organizations").insert({
    id: organizationId,
    name: payload.companyName,
    slug: `${slugify(payload.companyName)}-${user.id.slice(0, 6)}`,
    country: payload.country,
    business_type: payload.businessType,
    primary_industry: payload.primaryIndustry,
    intended_use: payload.intendedUse,
  });

  if (orgError) {
    return { error: orgError.message ?? "Could not create workspace." };
  }

  await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: user.id,
    role: "owner",
  });

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
      { organization_id: organizationId, credit_type: "discovery", remaining: starter.discovery_credits, allocated: starter.discovery_credits },
      { organization_id: organizationId, credit_type: "research", remaining: starter.research_credits, allocated: starter.research_credits },
      { organization_id: organizationId, credit_type: "website_generation", remaining: starter.website_generation_credits, allocated: starter.website_generation_credits },
      { organization_id: organizationId, credit_type: "outreach", remaining: starter.outreach_credits, allocated: starter.outreach_credits },
    ]);
  }

  await supabase
    .from("profiles")
    .update({
      full_name: payload.fullName,
      organization_id: organizationId,
      country: payload.country,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  redirect("/dashboard");
}
