import { Building2, Globe, Sparkles, UserCheck } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { OverviewKpi } from "@/types";

const icons = {
  violet: Building2,
  cyan: Globe,
  indigo: Sparkles,
  emerald: UserCheck,
};

const tones = {
  violet: "bg-violet-50 text-violet-600",
  cyan: "bg-sky-50 text-sky-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

export function KpiCard({ kpi }: { kpi: OverviewKpi }) {
  const Icon = icons[kpi.tone];
  const positive = (kpi.deltaPercent ?? 0) >= 0;
  const max = Math.max(...kpi.sparkline, 1);
  const points = kpi.sparkline
    .map((value, index) => {
      const x = (index / Math.max(kpi.sparkline.length - 1, 1)) * 80;
      const y = 28 - (value / max) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="surface-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[kpi.tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <svg width="84" height="32" viewBox="0 0 80 32" aria-hidden className="opacity-80">
          <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/70" points={points} />
        </svg>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
      <p className="mt-1 text-2xl font-bold tabular tracking-tight">{formatNumber(kpi.value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {kpi.deltaPercent !== null ? (
          <span className={positive ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
            {formatPercent(kpi.deltaPercent)}
          </span>
        ) : null}{" "}
        {kpi.comparisonLabel}
      </p>
    </article>
  );
}
