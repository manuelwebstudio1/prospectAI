import { z } from "zod";
import { inspectWebsite } from "@/services/website-detection/inspect";

export const websiteInspectorInputSchema = z.object({
  businessName: z.string().min(1),
  sourceUrl: z.string().nullable(),
  isSample: z.boolean().optional(),
});

export async function runWebsiteInspector(input: z.infer<typeof websiteInspectorInputSchema>) {
  const parsed = websiteInspectorInputSchema.parse(input);
  const result = await inspectWebsite(parsed);
  return { agent: "website_inspector" as const, ...result };
}
