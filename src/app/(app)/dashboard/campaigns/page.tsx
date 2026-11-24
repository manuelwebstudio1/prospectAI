import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listCampaigns } from "@/services/workspace/repository";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const campaigns = await listCampaigns(user.organizationId);

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Create, pause and review discovery campaigns.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/discovery">New campaign</Link>
        </Button>
      </div>
      <div className="surface-card overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/discovery">Start discovery</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Industry</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="hover:text-primary">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{campaign.city ?? "—"}</td>
                  <td className="px-5 py-3">{campaign.industry ?? "—"}</td>
                  <td className="px-5 py-3 tabular text-muted-foreground">
                    {campaign.progress.processed}/{campaign.progress.discovered || campaign.discovery_limit}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={campaign.status === "running" ? "success" : campaign.status === "failed" ? "destructive" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
