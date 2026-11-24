"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getLead } from "@/services/workspace/repository";
import { researchBusiness } from "@/services/research/run";

export type ResearchActionState = { error?: string; success?: string } | null;

export async function runResearchAction(
  _prev: ResearchActionState,
  formData: FormData,
): Promise<ResearchActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };

  const leadId = String(formData.get("leadId") ?? "");
  const userNotes = String(formData.get("userNotes") ?? "").trim() || null;
  const lead = await getLead(user.organizationId, leadId);
  if (!lead?.business) return { error: "Lead not found." };

  try {
    const result = await researchBusiness({
      organizationId: user.organizationId,
      userId: user.id,
      leadId: lead.id,
      business: lead.business,
      userNotes,
    });
    revalidatePath(`/dashboard/leads/${lead.id}`);
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/builder");
    const mode =
      result.researchMode === "ai"
        ? "AI researcher"
        : "records-only compilation (AI provider not configured or unavailable)";
    return {
      success: `Research saved via ${mode}. Architect mode: ${result.architectMode}. Unknown fields stay unknown.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Research failed." };
  }
}
