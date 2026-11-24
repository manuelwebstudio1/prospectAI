"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { updateBusinessWebsiteStatus } from "@/services/workspace/repository";
import type { WebsiteStatus } from "@/types";

export async function correctWebsiteStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const businessId = String(formData.get("businessId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "unverified") as WebsiteStatus;
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || null;
  if (!businessId) return;
  await updateBusinessWebsiteStatus(user.organizationId, businessId, status, websiteUrl);
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
}
