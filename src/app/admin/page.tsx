import type { Metadata } from "next";
import { formatCurrency } from "@/lib/utils";
import { getAdminOverview } from "@/services/admin/store";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const stats = await getAdminOverview();
  const cards = [
    { label: "Registered users", value: stats.users.toLocaleString() },
    { label: "Active subscriptions", value: stats.activeSubscriptions.toLocaleString() },
    { label: "MRR", value: formatCurrency(stats.mrrGhs) },
    { label: "Campaigns", value: stats.campaigns.toLocaleString() },
    { label: "Businesses discovered", value: stats.businesses.toLocaleString() },
    { label: "Websites generated", value: stats.demos.toLocaleString() },
    { label: "Payment transactions", value: stats.payments.toLocaleString() },
    { label: "Failed jobs", value: stats.failedJobs.toLocaleString() },
  ];

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administrator overview</h1>
        <p className="text-sm text-muted-foreground">
          Counts come from stored workspace records. Authorization is checked on the server; hiding this nav is not access control.
        </p>
      </div>
      {stats.source === "local" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase is not connected. These figures are the local labelled workspace only — not platform-wide production metrics.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="surface-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
