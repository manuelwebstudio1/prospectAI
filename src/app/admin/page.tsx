import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { getAdminOverview } from "@/services/admin/store";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const stats = await getAdminOverview();
  const cards = [
    { label: "Users on the system", value: stats.users.toLocaleString(), href: "/admin/users" },
    { label: "Workspaces", value: stats.organizations.toLocaleString(), href: "/admin/users" },
    { label: "Revenue collected", value: formatCurrency(stats.revenueGhs), href: "/admin/subscriptions" },
    { label: "Monthly recurring (MRR)", value: formatCurrency(stats.mrrGhs), href: "/admin/subscriptions" },
    { label: "Paid subscriptions", value: stats.activeSubscriptions.toLocaleString(), href: "/admin/subscriptions" },
    { label: "Trials", value: stats.trialSubscriptions.toLocaleString(), href: "/admin/subscriptions" },
    { label: "Successful payments", value: stats.paidPayments.toLocaleString(), href: "/admin/subscriptions" },
    { label: "Campaigns run", value: stats.campaigns.toLocaleString(), href: "/admin/jobs" },
    { label: "Businesses discovered", value: stats.businesses.toLocaleString(), href: "/admin/jobs" },
    { label: "Demo websites", value: stats.demos.toLocaleString(), href: "/admin/jobs" },
    { label: "Failed jobs", value: stats.failedJobs.toLocaleString(), href: "/admin/jobs" },
  ];
  const mixTotal = stats.planMix.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-8 animate-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Platform control</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Administrator overview</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This is your management console. You see every registered user, every workspace, collected Ghana Cedi payments, and platform activity. Customer workspaces live under Dashboard — they cannot open this area.
        </p>
      </div>

      {stats.source === "local" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase is not connected. These figures are the local labelled workspace only — not platform-wide production metrics.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="surface-card p-5 transition-colors hover:border-primary/40">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Plan mix</h2>
            <Link href="/admin/plans" className="text-sm font-medium text-primary">
              Edit prices
            </Link>
          </div>
          {stats.planMix.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions yet. New sign-ups appear here after onboarding.</p>
          ) : (
            <ul className="space-y-3">
              {stats.planMix.map((item) => (
                <li key={item.slug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="tabular text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((item.count / mixTotal) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent payments</h2>
            <Link href="/admin/subscriptions" className="text-sm font-medium text-primary">
              All billing
            </Link>
          </div>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Moolre payments recorded yet. Collected revenue stays at {formatCurrency(0)} until a checkout is fulfilled.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {stats.recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="block font-medium">{payment.organization_name ?? "Workspace"}</span>
                    <span className="text-xs text-muted-foreground">
                      {payment.status} · {payment.created_at.slice(0, 10)}
                    </span>
                  </span>
                  <span className="tabular font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Latest users</h2>
          <Link href="/admin/users" className="text-sm font-medium text-primary">
            Manage users
          </Link>
        </div>
        {stats.recentUsers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No profiles yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Workspace</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-5 py-3">
                    <p className="font-medium">{user.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">{user.organization_name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{user.created_at.slice(0, 10) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
