import { z } from "zod";

export const unknownListSchema = z.array(z.string());

export const researchReportSchema = z.object({
  businessName: z.string(),
  industry: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  services: z.array(z.string()),
  products: z.array(z.string()),
  publicContacts: z.object({
    phone: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    address: z.string().nullable(),
  }),
  socialMedia: z.object({
    facebook: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    twitter: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    other: z.string().nullable().optional(),
  }),
  onlinePresenceNotes: z.string().nullable(),
  websiteNeed: z.string().nullable(),
  unknowns: unknownListSchema,
  caveats: z.array(z.string()),
});

export const websiteArchitectureSchema = z.object({
  websiteType: z.string(),
  rationale: z.string(),
  pages: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      purpose: z.string(),
    }),
  ),
  colourPalette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  designDirection: z.string(),
  requiredFunctionality: z.array(z.string()),
  contentStructure: z.array(z.string()),
  basedOnIndustry: z.string().nullable(),
  basedOnVerifiedFactsOnly: z.literal(true),
});

export const outreachDraftSchema = z.object({
  subject: z.string().min(4).max(120).nullable(),
  body: z.string().min(40).max(2500),
});

export type ResearchReport = z.infer<typeof researchReportSchema>;
export type WebsiteArchitecture = z.infer<typeof websiteArchitectureSchema>;
export type OutreachDraft = z.infer<typeof outreachDraftSchema>;
