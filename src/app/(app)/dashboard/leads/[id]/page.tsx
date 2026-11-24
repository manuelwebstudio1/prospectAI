import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/session";
import { getLatestResearch, getLead } from "@/services/workspace/repository";
import { listLeadNotes, listOutreach } from "@/services/workspace/outreach-store";
import { correctWebsiteStatusAction } from "../actions";
import { ResearchPanel } from "@/components/leads/research-panel";
import { CrmPanel } from "@/components/leads/crm-panel";
import { getAiStatus } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const lead = await getLead(user.organizationId, id);
  if (!lead) notFound();
  const business = lead.business;
  const research = business ? await getLatestResearch(user.organizationId, business.id) : null;
  const [notes, outreach] = await Promise.all([
    listLeadNotes(user.organizationId, lead.id),
    listOutreach(user.organizationId),
  ]);
  const drafts = outreach
    .filter((item) => item.lead_id === lead.id)
    .map((item) => ({ id: item.id, status: item.status, channel: item.channel }));
  const ai = getAiStatus();

  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{business?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[business?.city, business?.country].filter(Boolean).join(", ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {business?.is_sample ? (
            <Badge variant="warning">Sample — not a verified business</Badge>
          ) : null}
          <Badge variant="secondary" className="capitalize">
            {lead.stage.replaceAll("_", " ")}
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card p-5 text-sm">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-3 space-y-2 text-muted-foreground">
            <div className="flex justify-between gap-4"><dt>Industry</dt><dd>{business?.industry ?? "Unknown"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Website status</dt><dd>{business?.website_status}</dd></div>
            <div className="flex justify-between gap-4"><dt>Phone</dt><dd>{business?.phone ?? "Unknown"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Email</dt><dd>{business?.email ?? "Unknown"}</dd></div>
            <div className="flex justify-between gap-4 break-all"><dt>Website</dt><dd>{business?.website_url ?? "None on file"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Source</dt><dd>{business?.source ?? "Unknown"}</dd></div>
          </dl>
        </article>
        <article className="surface-card p-5">
          <h2 className="font-semibold">Correct website classification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The inspector never treats a missing directory URL as proof of no website. You can override the status.
          </p>
          <form action={correctWebsiteStatusAction} className="mt-4 space-y-3">
            <input type="hidden" name="businessId" value={business?.id ?? ""} />
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input id="websiteUrl" name="websiteUrl" defaultValue={business?.website_url ?? ""} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={business?.website_status} className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
                <option value="no_website">No website</option>
                <option value="poor_website">Poor website</option>
                <option value="good_website">Good website</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
            <Button type="submit">Save correction</Button>
          </form>
        </article>
      </div>
      <CrmPanel leadId={lead.id} stage={lead.stage} notes={notes} drafts={drafts} />
      <ResearchPanel leadId={lead.id} research={research} aiConfigured={ai.configured} />
    </div>
  );
}
