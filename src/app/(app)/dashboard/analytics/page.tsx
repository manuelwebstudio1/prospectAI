import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCredits, listBusinesses, listCampaigns, listDemos, listLeads } from "@/services/workspace/repository";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const [campaigns, businesses, leads, demos, credits] = await Promise.all([
    listCampaigns(user.organizationId),
    listBusinesses(user.organizationId),
    listLeads(user.organizationId),
    listDemos(user.organizationId),
    getCredits(user.organizationId),
  ]);

  const byStatus = (status: string) => businesses.filter((item) => item.website_status === status).length;
  const byStage = (stage: string) => leads.filter((item) => item.stage === stage).length;

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace analytics</h1>
        <p className="text-sm text-muted-foreground">
          These numbers are counted from your stored records. Sample directory rows stay labelled on the leads themselves.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Campaigns" value={campaigns.length} />
        <Stat label="Businesses" value={businesses.length} />
        <Stat label="Leads" value={leads.length} />
        <Stat label="Unofficial demos" value={demos.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="font-semibold">Website status</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>No website: {byStatus("no_website")}</li>
            <li>Has website: {byStatus("good_website")}</li>
            <li>Unverified: {byStatus("unverified")}</li>
          </ul>
        </div>
        <div className="surface-card p-5">
          <h2 className="font-semibold">Pipeline</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>New: {byStage("new_lead")}</li>
            <li>Contacted: {byStage("contacted")}</li>
            <li>Interested: {byStage("interested")}</li>
            <li>Converted: {byStage("converted")}</li>
          </ul>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Discovery credits remaining {credits.remaining.toLocaleString()} / {credits.allocated.toLocaleString()}.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
