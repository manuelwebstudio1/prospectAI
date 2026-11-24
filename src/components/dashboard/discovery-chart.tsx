"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DiscoveryPoint } from "@/types";

export function DiscoveryChart({ data }: { data: DiscoveryPoint[] }) {
  const chartData = data.length
    ? data
    : [
        { date: "—", total: 0, withoutWebsite: 0 },
      ];

  return (
    <article className="surface-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Business Discovery Activity</h2>
          <p className="text-xs text-muted-foreground">Businesses found vs. without website</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Total Discovered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-500" /> Without Website
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="noneFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6bf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7c6bf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ecf4" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e8ecf4", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="#0ea5e9" fill="url(#totalFill)" strokeWidth={2.4} />
            <Area type="monotone" dataKey="withoutWebsite" stroke="#7c6bf6" fill="url(#noneFill)" strokeWidth={2.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
