export type CampaignStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type WebsiteStatus =
  | "no_website"
  | "poor_website"
  | "good_website"
  | "unverified";

export type LeadStage =
  | "new_lead"
  | "researched"
  | "demo_generated"
  | "ready_to_contact"
  | "contacted"
  | "interested"
  | "negotiation"
  | "converted"
  | "not_interested";

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";
export type PlatformRole = "user" | "admin" | "super_admin";
export type CreditType =
  | "discovery"
  | "research"
  | "website_generation"
  | "outreach";

export type OutreachChannel = "email" | "whatsapp" | "other";
export type OutreachStatus = "draft" | "approved" | "scheduled" | "sent" | "failed" | "cancelled";
export type OutreachDelivery = "unsent" | "resend" | "whatsapp_cloud" | "manual";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  onboardingCompleted: boolean;
  platformRole: PlatformRole;
  isSample: boolean;
};

export type OverviewKpi = {
  key: string;
  label: string;
  value: number;
  deltaPercent: number | null;
  comparisonLabel: string;
  sparkline: number[];
  tone: "violet" | "cyan" | "indigo" | "emerald";
};

export type DiscoveryPoint = {
  date: string;
  total: number;
  withoutWebsite: number;
};

export type WebsiteStatusSlice = {
  status: WebsiteStatus;
  label: string;
  value: number;
  color: string;
};

export type RecentDiscovery = {
  id: string;
  name: string;
  industry: string;
  location: string;
  websiteStatus: WebsiteStatus;
  discoveredAt: string;
  isSample: boolean;
};

export type ActiveCampaign = {
  id: string;
  name: string;
  summary: string;
  progress: number;
  status: CampaignStatus;
  isSample: boolean;
};

export type RecentDemo = {
  id: string;
  businessName: string;
  createdAt: string;
  thumbnailTone: "dark" | "rose" | "amber";
  isSample: boolean;
};

export type PlanUsage = {
  planName: string;
  planSlug: string;
  monthlyGhs: number;
  renewsOn: string | null;
  creditsUsed: number;
  creditsTotal: number;
  features: string[];
};

export type DashboardOverview = {
  userName: string;
  kpis: OverviewKpi[];
  discoveryActivity: DiscoveryPoint[];
  websiteStatus: WebsiteStatusSlice[];
  totalBusinesses: number;
  recentDiscoveries: RecentDiscovery[];
  activeCampaigns: ActiveCampaign[];
  recentDemos: RecentDemo[];
  plan: PlanUsage;
  isPreviewData: boolean;
};
