import type {
  CampaignStatus,
  LeadStage,
  OutreachChannel,
  OutreachDelivery,
  OutreachStatus,
  WebsiteStatus,
} from "@/types";
import type { ResearchReport, WebsiteArchitecture } from "@/lib/ai/schemas";

export type CampaignProgress = {
  discovered: number;
  processed: number;
  no_website: number;
  has_website: number;
  poor_website: number;
  unverified: number;
  failed: number;
  duplicates: number;
  source_mode: "places" | "sample" | null;
  current_step: string | null;
};

export type PlaceHit = {
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  phone: string | null;
  websiteUri: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  types: string[];
  source: "google_places" | "sample_directory";
};

export type CampaignRecord = {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  country: string;
  region: string | null;
  city: string | null;
  industry: string | null;
  custom_category: string | null;
  discovery_limit: number;
  website_status_filter: string;
  status: CampaignStatus;
  progress: CampaignProgress;
  last_error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignJobRecord = {
  id: string;
  campaign_id: string;
  organization_id: string;
  job_type: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "retrying";
  attempts: number;
  last_error: string | null;
  payload: {
    hunted: boolean;
    hits: PlaceHit[];
    cursor: number;
    source_mode: "places" | "sample";
    form: Record<string, unknown>;
  };
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type BusinessRecord = {
  id: string;
  organization_id: string;
  campaign_id: string | null;
  name: string;
  normalized_name: string;
  industry: string | null;
  category: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  website_status: WebsiteStatus;
  source: string | null;
  external_place_id: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

export type InspectionRecord = {
  id: string;
  business_id: string;
  organization_id: string;
  url: string | null;
  verification_status: WebsiteStatus;
  http_status: number | null;
  is_reachable: boolean | null;
  redirect_url: string | null;
  mobile_score: number | null;
  performance_score: number | null;
  seo_score: number | null;
  evidence: Record<string, unknown>;
  evidence_source: string | null;
  confidence: number | null;
  inspected_at: string;
};

export type LeadRecord = {
  id: string;
  organization_id: string;
  business_id: string;
  stage: LeadStage;
  owner_id: string | null;
  tags: string[];
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ResearchRecord = {
  id: string;
  business_id: string;
  organization_id: string;
  report: ResearchReport;
  architecture: WebsiteArchitecture;
  research_mode: "ai" | "records_only";
  architect_mode: "ai" | "blueprint";
  model: string | null;
  created_at: string;
};

export type LeadNoteRecord = {
  id: string;
  lead_id: string;
  organization_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type OutreachMessageRecord = {
  id: string;
  organization_id: string;
  lead_id: string;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  status: OutreachStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  approved_by: string | null;
  recipient: string | null;
  delivery_method: OutreachDelivery;
  last_error: string | null;
  demo_url: string | null;
  is_sample: boolean;
  draft_mode: "ai" | "deterministic";
  created_at: string;
  updated_at: string;
};

export type OutreachEventRecord = {
  id: string;
  message_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  organization_id: string;
  provider: "moolre";
  external_ref: string;
  provider_reference: string | null;
  amount: number;
  currency: "GHS";
  status: "pending" | "paid" | "failed" | "expired";
  plan_slug: string;
  billing_interval: "monthly" | "annual";
  checkout_url: string | null;
  failure_reason: string | null;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LocalSubscriptionRecord = {
  organization_id: string;
  plan_slug: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "paused" | "incomplete";
  billing_interval: "monthly" | "annual";
  current_period_start: string | null;
  current_period_end: string | null;
  last_external_ref: string | null;
  updated_at: string;
};

export type ActivityLogRecord = {
  id: string;
  organization_id: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  full_name: string;
  organization_id: string | null;
  organization_name: string | null;
  platform_role: "user" | "admin" | "super_admin";
  suspended_at: string | null;
  created_at: string;
};

export type PlatformSettings = {
  trial_days: number;
  default_plan: string;
};

export type PlanOverride = {
  monthlyGhs?: number;
  annualGhs?: number;
  discoveryCredits?: number;
  researchCredits?: number;
  websiteCredits?: number;
  outreachCredits?: number;
  maxTeamMembers?: number;
  isActive?: boolean;
};

export type WebhookEventRecord = {
  event_id: string;
  event: string;
  received_at: string;
};

export type AiUsageRecord = {
  id: string;
  organization_id: string;
  user_id: string | null;
  agent: string;
  provider: string;
  model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const emptyProgress = (): CampaignProgress => ({
  discovered: 0,
  processed: 0,
  no_website: 0,
  has_website: 0,
  poor_website: 0,
  unverified: 0,
  failed: 0,
  duplicates: 0,
  source_mode: null,
  current_step: "queued",
});
