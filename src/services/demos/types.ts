import type { WebsiteArchitecture } from "@/lib/ai/schemas";

export const DEMO_TEMPLATES = [
  { key: "professional_services", label: "Professional services" },
  { key: "real_estate", label: "Real estate" },
  { key: "restaurant", label: "Restaurant" },
  { key: "hotel", label: "Hotel" },
  { key: "construction", label: "Construction" },
  { key: "school", label: "School" },
  { key: "beauty", label: "Beauty" },
  { key: "ecommerce", label: "Retail / e-commerce" },
] as const;

export type DemoPalette = WebsiteArchitecture["colourPalette"];

export type DemoPage = {
  slug: string;
  title: string;
  purpose: string;
};

export type DemoContent = {
  headline: string;
  subhead: string;
  about: string;
  cta: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  services: string[];
  unknownsNote: string;
  copyMode: "ai" | "deterministic";
};

export type DemoWebsiteRecord = {
  id: string;
  organization_id: string;
  business_id: string;
  research_id: string | null;
  lead_id: string | null;
  demo_id: string;
  template_key: string;
  status: "queued" | "generating" | "ready" | "failed" | "expired";
  preview_path: string;
  palette: DemoPalette;
  content: DemoContent;
  pages: DemoPage[];
  business_name: string;
  industry: string | null;
  is_sample: boolean;
  is_unofficial: true;
  expires_at: string;
  created_at: string;
  updated_at: string;
};
