"use server";

import { websiteInspectorInputSchema, runWebsiteInspector } from "@/agents/website-inspector";

export type AnalyzerState = {
  error?: string;
  result?: Awaited<ReturnType<typeof runWebsiteInspector>>;
} | null;

export async function inspectUrlAction(_prev: AnalyzerState, formData: FormData): Promise<AnalyzerState> {
  const parsed = websiteInspectorInputSchema.safeParse({
    businessName: formData.get("businessName") || "Unknown business",
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || null,
    isSample: false,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a URL to inspect." };
  }
  try {
    const result = await runWebsiteInspector(parsed.data);
    return { result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Inspection failed." };
  }
}
