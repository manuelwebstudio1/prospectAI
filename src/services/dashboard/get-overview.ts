import { env } from "@/lib/env";
import { emptyOverview, getPreviewOverview } from "@/lib/dev/preview-overview";
import type { CurrentUser, DashboardOverview, WebsiteStatus } from "@/types";
import { getCredits, listBusinesses, listCampaigns, listDemos, listLeads } from "@/services/workspace/repository";
import { getSubscription } from "@/services/workspace/billing-store";
import { planUsageFromSubscription } from "@/services/billing/plan-usage";

export async function getDashboardOverview(user: CurrentUser): Promise<DashboardOverview> {
  const firstName = user.fullName.split(" ")[0] ?? user.fullName;
  const fallback = env.devPreviewData ? getPreviewOverview(firstName) : emptyOverview(firstName);

  if (!user.organizationId) return fallback;

  const [businesses, campaigns, leads, credits, demos, subscription] = await Promise.all([
    listBusinesses(user.organizationId),
    listCampaigns(user.organizationId),
    listLeads(user.organizationId),
    getCredits(user.organizationId),
    listDemos(user.organizationId),
    getSubscription(user.organizationId),
  ]);

  if (businesses.length === 0 && campaigns.length === 0 && env.devPreviewData) {
    if (subscription) fallback.plan = await planUsageFromSubscription(subscription, credits);
    return fallback;
  }

  const overview = emptyOverview(firstName);
  overview.isPreviewData = businesses.some((item) => item.is_sample) && businesses.every((item) => item.is_sample);
  overview.totalBusinesses = businesses.length;

  const countStatus = (status: WebsiteStatus) => businesses.filter((item) => item.website_status === status).length;
  const noWebsite = countStatus("no_website");
  const unverified = countStatus("unverified");
  const hasWebsite = countStatus("good_website");
  const interested = leads.filter((lead) => lead.stage === "interested").length;
  const contacted = leads.filter((lead) => lead.stage === "contacted").length;

  overview.kpis[0] = { ...overview.kpis[0], value: businesses.length, comparisonLabel: "Workspace records" };
  overview.kpis[1] = { ...overview.kpis[1], value: noWebsite, comparisonLabel: "Confirmed no website" };
  overview.kpis[2] = { ...overview.kpis[2], value: demos.length, comparisonLabel: "Unofficial previews" };
  overview.kpis[3] = {
    ...overview.kpis[3],
    value: interested,
    comparisonLabel: contacted ? `${contacted} contacted` : "Lead pipeline",
  };

  overview.websiteStatus = [
    { status: "no_website", label: "No Website", value: noWebsite, color: "#6D5EF6" },
    { status: "good_website", label: "Has Website", value: hasWebsite, color: "#38BDF8" },
    { status: "unverified", label: "Unverified", value: unverified, color: "#C4B5FD" },
  ];

  overview.recentDiscoveries = businesses.slice(0, 5).map((row) => ({
    id: row.id,
    name: row.name,
    industry: row.industry ?? "Unclassified",
    location: [row.city, row.country].filter(Boolean).join(", ") || "Unknown",
    websiteStatus: row.website_status,
    discoveredAt: row.created_at.slice(0, 10),
    isSample: row.is_sample,
  }));

  overview.activeCampaigns = campaigns
    .filter((row) => ["queued", "running", "paused"].includes(row.status))
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      name: row.name,
      summary: `${row.city ?? "Multiple cities"} · ${row.industry ?? "Mixed industries"}`,
      progress: Math.min(100, Math.round((row.progress.processed / Math.max(row.progress.discovered || row.discovery_limit, 1)) * 100)),
      status: row.status,
      isSample: row.progress.source_mode === "sample",
    }));

  const tones = ["dark", "rose", "amber"] as const;
  overview.recentDemos = demos.slice(0, 3).map((demo, index) => ({
    id: demo.id,
    businessName: demo.business_name,
    createdAt: demo.created_at.slice(0, 10),
    thumbnailTone: tones[index % tones.length],
    isSample: demo.is_sample,
  }));

  overview.plan = await planUsageFromSubscription(subscription, credits);

  return overview;
}
