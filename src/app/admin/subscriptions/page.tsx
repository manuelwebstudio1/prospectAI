import type { Metadata } from "next";
import { listAdminSubscriptions } from "@/services/admin/store";

export const metadata: Metadata = { title: "Admin subscriptions" };

export default async function AdminSubscriptionsPage() {
  const rows = await listAdminSubscriptions();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Stored subscriptions only. Trialing workspaces are not counted as MRR.</p>
      </div>
      {rows.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No subscription records yet.</p>
      ) : (
        <ul className="surface-card divide-y">
          {rows.map((row) => (
            <li key={row.organization_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span>
                {row.organization_name} · {row.plan_slug}
              </span>
              <span className="text-muted-foreground">
                {row.status} · {row.billing_interval}
                {row.current_period_end ? ` · until ${String(row.current_period_end).slice(0, 10)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
