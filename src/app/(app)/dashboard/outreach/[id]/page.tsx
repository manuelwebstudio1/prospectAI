import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageActions } from "@/components/outreach/message-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { integrationStatus } from "@/lib/env";
import {
  cancelOutreachAction,
  createFollowUpAction,
  saveDraftEditsAction,
} from "../actions";
import { getLead } from "@/services/workspace/repository";
import { getOutreach, listOutreachEvents } from "@/services/workspace/outreach-store";

export const metadata: Metadata = { title: "Outreach message" };

export default async function OutreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const message = await getOutreach(user.organizationId, id);
  if (!message) notFound();
  const [lead, events] = await Promise.all([
    getLead(user.organizationId, message.lead_id),
    listOutreachEvents(message.id),
  ]);
  const integrations = integrationStatus();
  const editable = message.status === "draft" || message.status === "failed";

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lead?.business?.name ?? "Outreach draft"}</h1>
          <p className="text-sm text-muted-foreground">
            {message.channel} · recipient {message.recipient ?? "unknown"} · {message.draft_mode} copy
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{message.status}</Badge>
            {message.is_sample ? <Badge variant="warning">Sample — live API send blocked</Badge> : null}
            {message.demo_url ? <Badge variant="muted">Includes unofficial demo link</Badge> : null}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/leads/${message.lead_id}`}>Open lead</Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="surface-card space-y-4 p-5">
          {editable ? (
            <form action={saveDraftEditsAction} className="space-y-3">
              <input type="hidden" name="messageId" value={message.id} />
              {message.channel === "email" ? (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" defaultValue={message.subject ?? ""} />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" name="body" defaultValue={message.body} className="min-h-64" />
              </div>
              <Button type="submit" variant="outline">
                Save edits
              </Button>
            </form>
          ) : (
            <div className="space-y-3 whitespace-pre-wrap text-sm">
              {message.subject ? <p className="font-semibold">{message.subject}</p> : null}
              <p>{message.body}</p>
            </div>
          )}
          {message.last_error ? <p className="text-sm text-red-600">{message.last_error}</p> : null}
        </article>

        <aside className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="mb-3 font-semibold">Approval and send</h2>
            <MessageActions
              message={message}
              emailConfigured={integrations.resend}
              whatsappConfigured={integrations.whatsapp}
            />
            {message.status !== "sent" ? (
              <form action={cancelOutreachAction} className="mt-4">
                <input type="hidden" name="messageId" value={message.id} />
                <Button type="submit" variant="ghost">
                  Cancel
                </Button>
              </form>
            ) : (
              <form action={createFollowUpAction} className="mt-4">
                <input type="hidden" name="messageId" value={message.id} />
                <Button type="submit" variant="outline">
                  Draft a follow-up (not sent)
                </Button>
              </form>
            )}
          </div>
          <div className="surface-card p-5">
            <h2 className="mb-3 font-semibold">Events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No delivery events yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.event_type}</span>
                    <span className="block text-xs text-muted-foreground">{item.created_at.replace("T", " ").slice(0, 16)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
