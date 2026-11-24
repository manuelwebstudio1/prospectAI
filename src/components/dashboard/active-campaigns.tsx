import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ActiveCampaign } from "@/types";

function statusVariant(status: ActiveCampaign["status"]) {
  if (status === "running") return "success" as const;
  if (status === "paused") return "warning" as const;
  if (status === "failed") return "destructive" as const;
  return "muted" as const;
}

export function ActiveCampaigns({ items }: { items: ActiveCampaign[] }) {
  return (
    <article className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Active Campaigns</h2>
        <Link href="/dashboard/campaigns" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active campaigns. Create one from Discover Businesses.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.summary}</p>
                </div>
                <Badge variant={statusVariant(item.status)} className="capitalize">
                  {item.status}
                </Badge>
              </div>
              <Progress value={item.progress} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
