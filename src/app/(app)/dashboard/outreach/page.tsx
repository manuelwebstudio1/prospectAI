import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { integrationStatus } from "@/lib/env";
import { LEAD_STAGES } from "@/constants";
import { listLeads } from "@/services/workspace/repository";
import { listOutreach } from "@/services/workspace/outreach-store";
import { sendDueOutreachAction } from "./actions";

export const metadata: Metadata = { title: "Outreach" };

export default async function OutreachPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const [messages, leads] = await Promise.all([
    listOutreach(user.organizationId),
    listLeads(user.organizationId),
  ]);
  const integrations = integrationStatus();
  const leadName = new Map(leads.map((lead) => [lead.id, lead.business?.name ?? "Unknown"]));
  const pipeline = LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.stage === stage).length,
  }));

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafts are never sent automatically. Approval is required. Unsolicited bulk sending is not available.
          </p>
        </div>
        <form action={sendDueOutreachAction}>
          <Button type="submit" variant="outline">
            Send due approved messages
          </Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface-card px-5 py-4 text-sm">
          <p className="font-medium">Email (Resend)</p>
          <p className="text-muted-foreground">{integrations.resend ? "Configured" : "Not configured — API send disabled"}</p>
        </div>
        <div className="surface-card px-5 py-4 text-sm">
          <p className="font-medium">WhatsApp Cloud API</p>
          <p className="text-muted-foreground">{integrations.whatsapp ? "Configured" : "Not configured — manual send after approval only"}</p>
        </div>
      </div>

      <div className="surface-card overflow-x-auto p-4">
        <p className="mb-3 text-sm font-semibold">Pipeline</p>
        <div className="flex min-w-max gap-3">
          {pipeline.map((item) => (
            <Link
              key={item.stage}
              href={`/dashboard/leads?stage=${item.stage}`}
              className="w-36 rounded-xl border px-3 py-2"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.stage.replaceAll("_", " ")}</p>
              <p className="text-xl font-bold">{item.count}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {messages.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No drafts yet. Open a lead and create a message. It will stay in draft until you approve it.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/outreach/${message.id}`} className="font-medium hover:text-primary">
                      {leadName.get(message.lead_id) ?? "Lead"}
                    </Link>
                    {message.is_sample ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Sample</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 capitalize">{message.channel}</td>
                  <td className="px-5 py-3">
                    <Badge variant={message.status === "sent" ? "success" : message.status === "failed" ? "destructive" : "secondary"}>
                      {message.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{message.delivery_method.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
