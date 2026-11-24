import Link from "next/link";
import { Check, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { PlanUsage } from "@/types";

export function PlanWidget({ plan }: { plan: PlanUsage }) {
  const pct = plan.creditsTotal
    ? Math.min(100, Math.round((plan.creditsUsed / plan.creditsTotal) * 100))
    : 0;

  return (
    <article className="surface-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your Plan</h2>
        <Badge>{plan.planName}</Badge>
      </div>
      <p className="text-2xl font-bold tracking-tight">
        GHS {plan.monthlyGhs} <span className="text-sm font-medium text-muted-foreground">/ month</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {plan.renewsOn ? `Renews on ${plan.renewsOn}` : "Trial — connect billing to start a paid plan"}
      </p>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Credits Usage</span>
          <span className="font-medium">
            {formatNumber(plan.creditsUsed)} / {formatNumber(plan.creditsTotal)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{pct}%</p>
      </div>
      <ul className="mt-3 space-y-2">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link href="/dashboard/billing">
          <Settings className="h-4 w-4" />
          Manage Plan
        </Link>
      </Button>
    </article>
  );
}
