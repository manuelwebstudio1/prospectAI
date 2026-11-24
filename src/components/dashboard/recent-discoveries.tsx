import Link from "next/link";
import {
  Building2,
  Car,
  HeartPulse,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecentDiscovery, WebsiteStatus } from "@/types";

const industryIcon = (industry: string) => {
  const value = industry.toLowerCase();
  if (value.includes("beauty")) return Sparkles;
  if (value.includes("auto")) return Car;
  if (value.includes("food") || value.includes("restaurant")) return UtensilsCrossed;
  if (value.includes("logistic")) return Truck;
  if (value.includes("health")) return HeartPulse;
  return Building2;
};

function statusBadge(status: WebsiteStatus) {
  if (status === "no_website") return <Badge variant="destructive">No Website</Badge>;
  if (status === "good_website") return <Badge variant="success">Has Website</Badge>;
  if (status === "poor_website") return <Badge variant="warning">Poor Website</Badge>;
  return <Badge variant="muted">Unverified</Badge>;
}

export function RecentDiscoveries({ items }: { items: RecentDiscovery[] }) {
  return (
    <article className="surface-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-primary">▣</span> Recent Discoveries
        </h2>
        <Link href="/dashboard/leads" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="px-5 pb-6 text-sm text-muted-foreground">
          No businesses yet. Start a discovery campaign to populate this table.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y bg-slate-50/70 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Business</th>
                <th className="px-3 py-2.5 font-medium">Industry</th>
                <th className="px-3 py-2.5 font-medium">Location</th>
                <th className="px-3 py-2.5 font-medium">Website</th>
                <th className="px-3 py-2.5 font-medium">Discovered</th>
                <th className="px-5 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const Icon = industryIcon(item.industry);
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block font-medium">{item.name}</span>
                          {item.isSample ? (
                            <span className="text-[10px] font-semibold uppercase text-amber-600">Sample</span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">{item.industry}</Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{item.location}</td>
                    <td className="px-3 py-3">{statusBadge(item.websiteStatus)}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(item.discoveredAt).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/leads/${item.id}`} className="text-xs font-semibold text-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
