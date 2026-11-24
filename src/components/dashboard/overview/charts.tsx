"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DiscoveryPoint, WebsiteStatusSlice } from "@/types";
import { formatNumber } from "@/lib/utils";

export function DiscoveryActivityChart({ data }: { data: DiscoveryPoint[] }) {
  const chartData = data.length
    ? data
    : [
        { date: "—", total: 0, withoutWebsite: 0 },
      ];

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Business Discovery Activity</h3>
          <p className="text-xs text-muted-foreground">Businesses found vs. without website</p>
        </div>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-violet-500" /> Total Discovered
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-sky-400" /> Without Website
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6d5ef6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6d5ef6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="noneFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e8ecf4", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="#6d5ef6" fill="url(#totalFill)" strokeWidth={2.4} />
            <Area type="monotone" dataKey="withoutWebsite" stroke="#38bdf8" fill="url(#noneFill)" strokeWidth={2.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function WebsiteStatusDonut({
  slices,
  total,
}: {
  slices: WebsiteStatusSlice[];
  total: number;
}) {
  return (
    <div className="surface-card p-5">
      <h3 className="font-semibold">Website Status Distribution</h3>
      <p className="text-xs text-muted-foreground">Among discovered businesses</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                innerRadius={48}
                outerRadius={70}
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
            <p className="text-lg font-bold tabular">{formatNumber(total)}</p>
            <p className="text-[10px] text-muted-foreground">Businesses</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {slices.map((slice) => {
            const pct = total ? ((slice.value / total) * 100).toFixed(1) : "0.0";
            return (
              <li key={slice.status} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                  {slice.label}
                </span>
                <span className="text-xs font-medium">
                  {pct}% ({formatNumber(slice.value)})
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
