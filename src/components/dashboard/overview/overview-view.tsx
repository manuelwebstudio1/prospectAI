import { WelcomeBanner } from "@/components/dashboard/overview/welcome-banner";
import { KpiCard } from "@/components/dashboard/overview/kpi-card";
import {
  DiscoveryActivityChart,
  WebsiteStatusDonut,
} from "@/components/dashboard/overview/charts";
import {
  ActiveCampaigns,
  PlanWidget,
  QuickActionsCard,
  RecentDemos,
  RecentDiscoveries,
} from "@/components/dashboard/overview/lists";
import type { DashboardOverview } from "@/types";

export function OverviewView({ data }: { data: DashboardOverview }) {
  return (
    <div className="space-y-5 animate-enter">
      {data.isPreviewData ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Development preview data is shown because the workspace has no live records yet.
          These are labelled sample figures, not verified businesses.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <WelcomeBanner name={data.userName} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <DiscoveryActivityChart data={data.discoveryActivity} />
            <WebsiteStatusDonut slices={data.websiteStatus} total={data.totalBusinesses} />
          </div>
          <RecentDiscoveries items={data.recentDiscoveries} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ActiveCampaigns items={data.activeCampaigns} />
            <RecentDemos items={data.recentDemos} />
          </div>
        </div>
        <div className="space-y-5">
          <QuickActionsCard />
          <PlanWidget plan={data.plan} />
        </div>
      </div>
    </div>
  );
}
