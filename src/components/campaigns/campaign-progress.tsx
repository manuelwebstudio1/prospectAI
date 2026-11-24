"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  deleteCampaignAction,
  duplicateCampaignAction,
  retryCampaignAction,
  setCampaignStatusAction,
} from "@/app/(app)/dashboard/campaigns/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BusinessRecord, CampaignJobRecord, CampaignRecord } from "@/services/workspace/types";
import type { WebsiteStatus } from "@/types";

type Snapshot = {
  campaign: CampaignRecord;
  job: CampaignJobRecord | null;
  businesses: BusinessRecord[];
  creditsRemaining: number;
  message?: string;
};

function statusBadge(status: string) {
  if (status === "running") return <Badge variant="success">Running</Badge>;
  if (status === "queued") return <Badge variant="warning">Queued</Badge>;
  if (status === "paused") return <Badge variant="warning">Paused</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (status === "completed") return <Badge variant="success">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="muted">Cancelled</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function websiteBadge(status: WebsiteStatus) {
  if (status === "no_website") return <Badge variant="destructive">No Website</Badge>;
  if (status === "poor_website") return <Badge variant="warning">Poor Website</Badge>;
  if (status === "good_website") return <Badge variant="success">Has Website</Badge>;
  return <Badge variant="muted">Unverified</Badge>;
}

export function CampaignProgress({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [pending, startTransition] = useTransition();
  const campaign = snapshot.campaign;
  const progress = campaign.progress;
  const total = Math.max(campaign.discovery_limit, progress.discovered, 1);
  const pct = Math.min(100, Math.round((progress.processed / total) * 100));
  const active = campaign.status === "queued" || campaign.status === "running";

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        try {
          const response = await fetch("/api/jobs/tick", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId: campaign.id }),
          });
          const json = (await response.json()) as Snapshot & { error?: string };
          if (!cancelled && json.campaign) setSnapshot(json);
          const status = json.campaign?.status;
          if (!status || ["completed", "failed", "cancelled", "paused"].includes(status)) break;
        } catch {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    void loop();
    return () => {
      cancelled = true;
    };
  }, [campaign.id, campaign.status, active]);

  const metrics = [
    ["Discovered", progress.discovered],
    ["Processed", progress.processed],
    ["No website", progress.no_website],
    ["Has website", progress.has_website],
    ["Poor website", progress.poor_website],
    ["Unverified", progress.unverified],
    ["Duplicates", progress.duplicates],
    ["Failed", progress.failed],
  ] as const;

  return (
    <div className="space-y-5 animate-enter">
      {progress.source_mode === "sample" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Running against the labelled development directory because Google Places is not configured.
          Sample records are not verified businesses. Add <code>GOOGLE_PLACES_API_KEY</code> for live search.
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Campaign</p>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[campaign.city, campaign.region, campaign.country].filter(Boolean).join(", ")} · {campaign.industry}
          </p>
        </div>
        {statusBadge(campaign.status)}
      </div>

      <div className="surface-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">{progress.current_step ?? "Waiting…"}</p>
          <p className="tabular text-muted-foreground">{pct}%</p>
        </div>
        <Progress value={pct} />
        <p className="mt-2 text-xs text-muted-foreground">
          Credits remaining: {snapshot.creditsRemaining.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {campaign.status === "draft" ? (
          <Button disabled={pending} onClick={() => startTransition(() => setCampaignStatusAction(campaign.id, "queued"))}>
            Start discovery
          </Button>
        ) : null}
        {campaign.status === "running" || campaign.status === "queued" ? (
          <Button variant="outline" disabled={pending} onClick={() => startTransition(() => setCampaignStatusAction(campaign.id, "paused"))}>
            Pause
          </Button>
        ) : null}
        {campaign.status === "paused" ? (
          <Button disabled={pending} onClick={() => startTransition(() => setCampaignStatusAction(campaign.id, "queued"))}>
            Resume
          </Button>
        ) : null}
        {campaign.status === "failed" ? (
          <Button disabled={pending} onClick={() => startTransition(() => retryCampaignAction(campaign.id))}>
            Retry
          </Button>
        ) : null}
        {campaign.status !== "cancelled" && campaign.status !== "completed" ? (
          <Button variant="outline" disabled={pending} onClick={() => startTransition(() => setCampaignStatusAction(campaign.id, "cancelled"))}>
            Cancel
          </Button>
        ) : null}
        <Button variant="outline" disabled={pending} onClick={() => startTransition(() => duplicateCampaignAction(campaign.id))}>
          Duplicate
        </Button>
        {campaign.status !== "running" ? (
          <Button variant="destructive" disabled={pending} onClick={() => startTransition(() => deleteCampaignAction(campaign.id))}>
            Delete
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/dashboard/leads">View leads</Link>
        </Button>
      </div>

      {campaign.last_error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{campaign.last_error}</p>
      ) : null}

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Qualified businesses</h2>
          <span className="text-xs text-muted-foreground">{snapshot.businesses.length} stored</span>
        </div>
        {snapshot.businesses.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted-foreground">
            Businesses appear here as they pass inspection and the campaign filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-t text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Business</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.businesses.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-5 py-3">
                      <p className="font-medium">{item.name}</p>
                      {item.is_sample ? (
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Sample</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {[item.city, item.country].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-3 py-3">{websiteBadge(item.website_status)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
