export const BUSINESS_CATEGORIES = [
  "Real estate",
  "Restaurants",
  "Hotels",
  "Construction companies",
  "Building materials suppliers",
  "Fashion stores",
  "Retail businesses",
  "Schools",
  "Hospitals and clinics",
  "Logistics companies",
  "Automotive businesses",
  "Beauty and cosmetics",
  "Travel agencies",
  "Professional services",
  "Other",
] as const;

export const SUPPORTED_COUNTRIES = [
  { code: "GH", name: "Ghana" },
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
] as const;

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Western North",
  "Central",
  "Eastern",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

export const WEBSITE_STATUS_FILTERS = [
  { value: "no_website", label: "No website" },
  { value: "poor_website", label: "Poor website" },
  { value: "any", label: "Any website status" },
] as const;

export const CAMPAIGN_STATUSES = [
  "draft",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

export const LEAD_STAGES = [
  "new_lead",
  "researched",
  "demo_generated",
  "ready_to_contact",
  "contacted",
  "interested",
  "negotiation",
  "converted",
  "not_interested",
] as const;

export const CREDIT_TYPES = [
  "discovery",
  "research",
  "website_generation",
  "outreach",
] as const;

export const OUTREACH_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export const OUTREACH_STATUSES = [
  "draft",
  "approved",
  "scheduled",
  "sent",
  "failed",
  "cancelled",
] as const;
