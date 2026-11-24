import Link from "next/link";
import {
  Car,
  HeartPulse,
  Plus,
  Search,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { quickActions } from "@/config/navigation";
import type { ActiveCampaign, PlanUsage, RecentDemo, RecentDiscovery } from "@/types";

const industryIcons: Record<string, typeof Store> = {
  "Beauty & Wellness": HeartPulse,
  Automotive: Car,
  "Food & Dining": UtensilsCrossed,
  Logistics: Truck,
  Healthcare: HeartPulse,
};

function websiteBadge(status: RecentDiscovery["websiteStatus"]) {
  if (status === "no_website") return <Badge variant="destructive">No Website</Badge>;
  if (status === "poor_website") return <Badge variant="warning">Poor Website</Badge>;
  if (status === "good_website") return <Badge variant="success">Has Website</Badge>;
  return <Badge variant="muted">Unverified</Badge>;
}

export function QuickActionsCard() {
  return (
    <div className="surface-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> Quick Actions
      </h3>
      <div className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-border hover:bg-muted/60"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-primary">
                {action.label === "Create Campaign" ? <Plus className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span>
                <span className="block text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PlanWidget({ plan }: { plan: PlanUsage }) {
  const pct = plan.creditsTotal
    ? Math.min(100, Math.round((plan.creditsUsed / plan.creditsTotal) * 100))
    : 0;
  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Your Plan</h3>
        <Badge>{plan.planName}</Badge>
      </div>
      <p className="text-2xl font-bold">
        GHS {plan.monthlyGhs}
        <span className="text-sm font-medium text-muted-foreground"> / month</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {plan.renewsOn ? `Renews on ${plan.renewsOn}` : "Trial or unconfigured billing period"}
      </p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Credits Usage</span>
          <span className="font-medium">
            {plan.creditsUsed.toLocaleString()} / {plan.creditsTotal.toLocaleString()}
          </span>
        </div>
        <Progress value={pct} />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{pct}%</p>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/billing"
        className="mt-4 flex h-10 items-center justify-center rounded-xl border text-sm font-semibold hover:bg-muted"
      >
        Manage Plan
      </Link>
    </div>
  );
}

export function RecentDiscoveries({ items }: { items: RecentDiscovery[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-semibold">Recent Discoveries</h3>
        <Link href="/dashboard/leads" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyRow
          icon={Search}
          title="No businesses yet"
          href="/dashboard/discovery"
          cta="Start discovery"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr className="border-t">
                <th className="px-5 py-2 font-medium">Business</th>
                <th className="px-3 py-2 font-medium">Industry</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Website</th>
                <th className="px-3 py-2 font-medium">Discovered</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const Icon = industryIcons[item.industry] ?? Store;
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block font-medium">{item.name}</span>
                          {item.isSample ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                              Sample
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">{item.industry}</Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{item.location}</td>
                    <td className="px-3 py-3">{websiteBadge(item.websiteStatus)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{item.discoveredAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ActiveCampaigns({ items }: { items: ActiveCampaign[] }) {
  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Active Campaigns</h3>
        <Link href="/dashboard/campaigns" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No active campaigns.{" "}
          <Link href="/dashboard/campaigns?new=1" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.summary}</p>
                </div>
                <Badge variant={item.status === "paused" ? "warning" : "success"}>
                  {item.status === "running" ? "Running" : item.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={item.progress} />
                <span className="w-8 text-right text-xs text-muted-foreground">{item.progress}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecentDemos({ items }: { items: RecentDemo[] }) {
  const tones = {
    dark: "from-slate-800 to-slate-950",
    rose: "from-rose-200 to-violet-200",
    amber: "from-amber-200 to-orange-300",
  };
  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent Demo Websites</h3>
        <Link href="/dashboard/demos" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No demos yet. Generate one from a researched lead.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/dashboard/demos/${item.id}`} className="group">
              <div className={`mb-2 h-20 rounded-xl bg-gradient-to-br ${tones[item.thumbnailTone]}`} />
              <p className="truncate text-xs font-medium group-hover:text-primary">{item.businessName}</p>
              <p className="text-[10px] text-muted-foreground">{item.createdAt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  title,
  href,
  cta,
}: {
  icon: typeof Search;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="px-5 pb-8 pt-2 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link href={href} className="mt-2 inline-block text-sm font-semibold text-primary">
        {cta}
      </Link>
    </div>
  );
}
