"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";
import type { PlanSlug } from "@/config/plans";
import {
  recordActivity,
  savePlanOverride,
  savePlatformSettings,
  setUserPlatformRole,
  setUserSuspended,
} from "@/services/admin/store";

export type AdminActionState = { error?: string; success?: string } | null;

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/plans");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/logs");
  revalidatePath("/pricing");
  revalidatePath("/dashboard/billing");
}

export async function suspendUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePlatformAdmin();
  const userId = String(formData.get("userId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "1";
  if (!userId) return { error: "Missing user." };
  if (userId === admin.id && suspend) return { error: "You cannot suspend your own account." };
  try {
    await setUserSuspended(userId, suspend);
    await recordActivity({
      organization_id: admin.organizationId,
      actor_id: admin.id,
      entity_type: "profile",
      entity_id: userId,
      action: suspend ? "user.suspended" : "user.unsuspended",
      metadata: {},
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update suspension." };
  }
  revalidateAdmin();
  return { success: suspend ? "Account suspended." : "Account restored." };
}

export async function updateRoleAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePlatformAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as "user" | "admin" | "super_admin";
  if (!userId || !["user", "admin", "super_admin"].includes(role)) return { error: "Choose a valid role." };
  if (role === "super_admin" && !isSuperAdmin(admin)) {
    return { error: "Only a super admin can grant super admin." };
  }
  if (userId === admin.id) return { error: "You cannot change your own platform role here." };
  try {
    await setUserPlatformRole(userId, role);
    await recordActivity({
      organization_id: admin.organizationId,
      actor_id: admin.id,
      entity_type: "profile",
      entity_id: userId,
      action: "user.role_changed",
      metadata: { role },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not change role." };
  }
  revalidateAdmin();
  return { success: "Role updated." };
}

export async function savePlanAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePlatformAdmin();
  const slug = String(formData.get("slug") ?? "") as PlanSlug;
  if (slug !== "starter" && slug !== "professional" && slug !== "agency") return { error: "Unknown plan." };
  try {
    await savePlanOverride(slug, {
      monthlyGhs: Number(formData.get("monthlyGhs")),
      annualGhs: Number(formData.get("annualGhs")),
      discoveryCredits: Number(formData.get("discoveryCredits")),
      researchCredits: Number(formData.get("researchCredits")),
      websiteCredits: Number(formData.get("websiteCredits")),
      outreachCredits: Number(formData.get("outreachCredits")),
      maxTeamMembers: Number(formData.get("maxTeamMembers")),
    });
    await recordActivity({
      organization_id: admin.organizationId,
      actor_id: admin.id,
      entity_type: "subscription_plan",
      entity_id: null,
      action: "plan.updated",
      metadata: { slug },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save plan." };
  }
  revalidateAdmin();
  return { success: `${slug} plan saved.` };
}

export async function saveSettingsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requirePlatformAdmin();
  const trialDays = Number(formData.get("trial_days"));
  const defaultPlan = String(formData.get("default_plan") ?? "starter");
  if (!Number.isFinite(trialDays) || trialDays < 0 || trialDays > 90) {
    return { error: "Trial days must be between 0 and 90." };
  }
  if (!["starter", "professional", "agency"].includes(defaultPlan)) {
    return { error: "Choose a valid default plan." };
  }
  try {
    await savePlatformSettings({ trial_days: trialDays, default_plan: defaultPlan });
    await recordActivity({
      organization_id: admin.organizationId,
      actor_id: admin.id,
      entity_type: "system_settings",
      entity_id: null,
      action: "settings.updated",
      metadata: { trial_days: trialDays, default_plan: defaultPlan },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save settings." };
  }
  revalidateAdmin();
  return { success: "Platform settings saved." };
}
