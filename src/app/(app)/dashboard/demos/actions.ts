"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { generateDemoWebsite } from "@/services/demos/generate";
import type { DemoPalette } from "@/services/demos/types";
import {
  deleteDemo,
  getBusiness,
  getDemo,
  getLatestResearch,
  getLead,
  getResearchById,
  listDemos,
  listLeads,
  saveDemo,
  updateDemoPalette,
  updateDemoTemplate,
} from "@/services/workspace/repository";

export type DemoActionState = { error?: string; success?: string } | null;

function revalidateDemoSurfaces(leadId?: string | null, previewPath?: string) {
  revalidatePath("/dashboard/demos");
  revalidatePath("/dashboard/builder");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/dashboard/leads/${leadId}`);
  if (previewPath) revalidatePath(previewPath);
}

export async function generateDemoAction(
  _prev: DemoActionState,
  formData: FormData,
): Promise<DemoActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };
  const organizationId = user.organizationId;
  const leadId = String(formData.get("leadId") ?? "").trim() || null;
  const researchId = String(formData.get("researchId") ?? "").trim() || null;

  const leadFromId = leadId ? await getLead(organizationId, leadId) : null;
  const research = researchId
    ? await getResearchById(organizationId, researchId)
    : leadFromId?.business?.id
      ? await getLatestResearch(organizationId, leadFromId.business.id)
      : null;
  if (!research) return { error: "Run research before generating a demo website." };

  const leads = leadFromId ? [leadFromId] : await listLeads(organizationId);
  const lead = leadFromId ?? leads.find((item) => item.business_id === research.business_id) ?? null;
  const business = lead?.business ?? (await getBusiness(organizationId, research.business_id));
  if (!business) return { error: "Business record not found." };

  const existing = (await listDemos(organizationId)).find(
    (item) => item.research_id === research.id || item.business_id === research.business_id,
  );

  let demo;
  try {
    demo = await generateDemoWebsite({
      organizationId,
      research,
      businessName: business.name,
      industry: business.industry,
      isSample: business.is_sample,
      leadId: lead?.id ?? existing?.lead_id ?? null,
      existing: existing ?? null,
    });
    await saveDemo(demo);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Demo generation failed." };
  }
  revalidateDemoSurfaces(demo.lead_id, demo.preview_path);
  redirect(`/dashboard/demos/${demo.id}`);
}

export async function regenerateDemoAction(
  _prev: DemoActionState,
  formData: FormData,
): Promise<DemoActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };
  const organizationId = user.organizationId;
  const demoId = String(formData.get("demoId") ?? "");
  const current = await getDemo(organizationId, demoId);
  if (!current) return { error: "Demo not found." };
  if (!current.research_id) return { error: "This demo has no research brief to regenerate from." };
  const research = await getResearchById(organizationId, current.research_id);
  if (!research) return { error: "Research brief is missing. Run research again." };
  const business = await getBusiness(organizationId, current.business_id);
  try {
    const demo = await generateDemoWebsite({
      organizationId,
      research,
      businessName: business?.name ?? current.business_name,
      industry: business?.industry ?? current.industry,
      isSample: business?.is_sample ?? current.is_sample,
      leadId: current.lead_id,
      existing: current,
    });
    await saveDemo(demo);
    revalidateDemoSurfaces(demo.lead_id, demo.preview_path);
    revalidatePath(`/dashboard/demos/${demo.id}`);
    return { success: "Demo regenerated from the current research brief." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Regeneration failed." };
  }
}

export async function updateDemoPaletteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const demoId = String(formData.get("demoId") ?? "");
  const palette: DemoPalette = {
    primary: String(formData.get("primary") ?? "#6D5EF6"),
    secondary: String(formData.get("secondary") ?? "#0F172A"),
    accent: String(formData.get("accent") ?? "#38BDF8"),
    background: String(formData.get("background") ?? "#F8FAFC"),
    text: String(formData.get("text") ?? "#0F172A"),
  };
  await updateDemoPalette(user.organizationId, demoId, palette);
  revalidatePath(`/dashboard/demos`);
  const demo = await getDemo(user.organizationId, demoId);
  if (demo) {
    revalidatePath(`/dashboard/demos/${demo.id}`);
    revalidatePath(demo.preview_path);
  }
}

export async function updateDemoTemplateAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const demoId = String(formData.get("demoId") ?? "");
  const templateKey = String(formData.get("templateKey") ?? "professional_services");
  await updateDemoTemplate(user.organizationId, demoId, templateKey);
  const demo = await getDemo(user.organizationId, demoId);
  revalidatePath("/dashboard/demos");
  if (demo) {
    revalidatePath(`/dashboard/demos/${demo.id}`);
    revalidatePath(demo.preview_path);
  }
}

export async function deleteDemoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const demoId = String(formData.get("demoId") ?? "");
  await deleteDemo(user.organizationId, demoId);
  revalidatePath("/dashboard/demos");
  revalidatePath("/dashboard");
  redirect("/dashboard/demos");
}
