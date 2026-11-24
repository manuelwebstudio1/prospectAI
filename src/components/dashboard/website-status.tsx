"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/lib/utils";
import type { WebsiteStatusSlice } from "@/types";

export function WebsiteStatusChart({
  slices,
  total,
}: {
  slices: WebsiteStatusSlice[];
  total: number;
}) {
  return (
    <article className="surface-card p-5">
      <h2 className="text-sm font-semibold">Website Status Distribution</h2>
      <p className="text-xs text-muted-foreground">Among discovered businesses</p>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={3}
                stroke="none"
              >
                {slices.map((slice) => (
                  <Cell key={slice.status} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular">{formatNumber(total)}</span>
            <span className="text-[10px] text-muted-foreground">Businesses</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs">
          {slices.map((slice) => {
            const pct = total ? ((slice.value / total) * 100).toFixed(1) : "0.0";
            return (
              <li key={slice.status} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                  {slice.label}
                </span>
                <span className="font-medium text-foreground">
                  {pct}% ({formatNumber(slice.value)})
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
