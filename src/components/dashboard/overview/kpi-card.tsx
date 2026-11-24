import { Building2, Globe, Sparkles, UserPlus } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { OverviewKpi } from "@/types";

const icons = {
  violet: Building2,
  cyan: Globe,
  indigo: Sparkles,
  emerald: UserPlus,
};

const tones = {
  violet: { icon: "bg-violet-100 text-violet-600", value: "text-violet-600", stroke: "#7c3aed" },
  cyan: { icon: "bg-sky-100 text-sky-600", value: "text-sky-600", stroke: "#0ea5e9" },
  indigo: { icon: "bg-indigo-100 text-indigo-600", value: "text-indigo-600", stroke: "#6366f1" },
  emerald: { icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-600", stroke: "#10b981" },
};

function MiniSpark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 64;
      const y = 22 - ((v - min) / Math.max(max - min, 1)) * 18;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 64 24" className="h-8 w-16" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

export function KpiCard({ kpi }: { kpi: OverviewKpi }) {
  const Icon = icons[kpi.tone];
  const tone = tones[kpi.tone];
  return (
    <article className="surface-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
        {kpi.deltaPercent != null ? (
          <span className="text-xs font-semibold text-emerald-600">
            {formatPercent(kpi.deltaPercent)}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
      <div className="mt-1 flex items-end justify-between">
        <p className={`text-2xl font-bold tabular ${tone.value}`}>{formatNumber(kpi.value)}</p>
        <MiniSpark values={kpi.sparkline} color={tone.stroke} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{kpi.comparisonLabel}</p>
    </article>
  );
}
