import { z } from "zod";
import { huntBusinesses } from "@/services/discovery/places";

export const businessHunterInputSchema = z.object({
  country: z.string(),
  region: z.string().nullable().optional(),
  city: z.string(),
  industry: z.string(),
  customCategory: z.string().nullable().optional(),
  discoveryLimit: z.number().int().min(1).max(5000),
});

export async function runBusinessHunter(input: z.infer<typeof businessHunterInputSchema>) {
  const parsed = businessHunterInputSchema.parse(input);
  const result = await huntBusinesses(parsed);
  return {
    agent: "business_hunter" as const,
    mode: result.mode,
    query: result.query,
    count: result.hits.length,
    hits: result.hits,
  };
}
