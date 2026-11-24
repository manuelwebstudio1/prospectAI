import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { listLeads } from "@/services/workspace/repository";
import type { WebsiteStatus } from "@/types";

export const metadata: Metadata = { title: "Leads" };

function websiteBadge(status?: WebsiteStatus) {
  if (status === "no_website") return <Badge variant="destructive">No Website</Badge>;
  if (status === "poor_website") return <Badge variant="warning">Poor Website</Badge>;
  if (status === "good_website") return <Badge variant="success">Has Website</Badge>;
  return <Badge variant="muted">Unverified</Badge>;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const { stage } = await searchParams;
  const all = await listLeads(user.organizationId);
  const leads = stage ? all.filter((lead) => lead.stage === stage) : all;

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All leads</h1>
          <p className="text-sm text-muted-foreground">
            Every stored discovery becomes a lead. Filter by CRM stage from Outreach, then open a profile to draft a message.
            {stage ? ` Showing stage: ${stage.replaceAll("_", " ")}.` : ""}
          </p>
          {stage ? (
            <Link href="/dashboard/leads" className="text-xs font-semibold text-primary">
              Clear stage filter
            </Link>
          ) : null}
        </div>
        <Button asChild>
          <Link href="/dashboard/discovery">Discover more</Link>
        </Button>
      </div>
      <div className="surface-card overflow-hidden">
        {leads.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No leads yet. Run a discovery campaign to populate this list.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Industry</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Website</th>
                <th className="px-5 py-3 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:text-primary">
                      {lead.business?.name ?? "Unknown business"}
                    </Link>
                    {lead.business?.is_sample ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Sample</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">{lead.business?.industry ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {[lead.business?.city, lead.business?.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3">{websiteBadge(lead.business?.website_status)}</td>
                  <td className="px-5 py-3 capitalize">{lead.stage.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
