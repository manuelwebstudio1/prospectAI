import type { Metadata } from "next";
import { listAiUsage } from "@/services/admin/store";

export const metadata: Metadata = { title: "Admin AI usage" };

export default async function AdminUsagePage() {
  const rows = await listAiUsage();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI consumption</h1>
        <p className="text-sm text-muted-foreground">Logged agent calls only. Missing AI keys produce deterministic fallbacks, which may not appear here.</p>
      </div>
      {rows.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No AI usage logs yet.</p>
      ) : (
        <ul className="surface-card divide-y">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              {row.agent} · {row.provider}
              {row.model ? ` · ${row.model}` : ""} · {String(row.created_at).slice(0, 19).replace("T", " ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
