import { z } from "zod";
import { SUPPORTED_COUNTRIES } from "@/constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    companyName: z.string().trim().max(80).optional(),
    email: z.string().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  companyName: z.string().min(2, "Enter your company or agency name."),
  country: z.enum(
    SUPPORTED_COUNTRIES.map((c) => c.code) as [string, ...string[]],
  ),
  businessType: z.enum([
    "freelancer",
    "web_agency",
    "software_company",
    "marketing_agency",
    "consultant",
    "other",
  ]),
  primaryIndustry: z.string().min(2, "Select a primary industry."),
  intendedUse: z.string().min(8, "Tell us how you plan to use ProspectAI."),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().optional(),
  message: z.string().min(12, "Please include a short message."),
});

export const campaignDraftSchema = z.object({
  name: z.string().min(3, "Give the campaign a name."),
  country: z.string().min(2),
  region: z.string().optional(),
  city: z.string().min(2, "Enter a city or area."),
  industry: z.string().min(2, "Select an industry."),
  customCategory: z.string().optional(),
  discoveryLimit: z.coerce.number().int().min(10).max(5000),
  websiteStatusFilter: z.enum(["no_website", "poor_website", "any"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;
