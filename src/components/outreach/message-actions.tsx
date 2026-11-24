"use client";

import { useActionState } from "react";
import {
  approveOutreachAction,
  sendOutreachAction,
  type OutreachActionState,
} from "@/app/(app)/dashboard/outreach/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OutreachMessageRecord } from "@/services/workspace/types";
import { whatsappManualLink } from "@/services/outreach/phone";

export function MessageActions({
  message,
  emailConfigured,
  whatsappConfigured,
}: {
  message: OutreachMessageRecord;
  emailConfigured: boolean;
  whatsappConfigured: boolean;
}) {
  const [approveState, approve, approving] = useActionState<OutreachActionState, FormData>(approveOutreachAction, null);
  const [sendState, send, sending] = useActionState<OutreachActionState, FormData>(sendOutreachAction, null);
  const canApprove = message.status === "draft" || message.status === "failed";
  const canSend = message.status === "approved" || message.status === "scheduled";
  const apiReady =
    message.channel === "email" ? emailConfigured : message.channel === "whatsapp" ? whatsappConfigured : false;
  const waLink =
    message.channel === "whatsapp" && message.recipient
      ? whatsappManualLink(message.recipient, message.body)
      : null;

  return (
    <div className="space-y-4">
      {approveState?.error ? <p className="text-sm text-red-600">{approveState.error}</p> : null}
      {approveState?.success ? <p className="text-sm text-emerald-700">{approveState.success}</p> : null}
      {sendState?.error ? <p className="text-sm text-red-600">{sendState.error}</p> : null}
      {sendState?.success ? <p className="text-sm text-emerald-700">{sendState.success}</p> : null}

      {canApprove ? (
        <form action={approve} className="space-y-3">
          <input type="hidden" name="messageId" value={message.id} />
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Optional send-after time</Label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              className="h-11 w-full rounded-xl border bg-card px-3 text-sm"
            />
          </div>
          <Button type="submit" disabled={approving}>
            {approving ? "Approving…" : "Approve (do not send yet)"}
          </Button>
        </form>
      ) : null}

      {canSend ? (
        <div className="space-y-3">
          <form action={send}>
            <input type="hidden" name="messageId" value={message.id} />
            <input type="hidden" name="method" value="api" />
            <Button type="submit" disabled={sending || !apiReady || message.is_sample}>
              {sending ? "Sending…" : "Send now"}
            </Button>
          </form>
          {!apiReady ? (
            <p className="text-xs text-muted-foreground">
              {message.channel === "email"
                ? "Resend is not configured. The draft can be copied or marked sent manually."
                : "WhatsApp Cloud API is not configured. After approval you can open WhatsApp yourself or mark it sent manually."}
            </p>
          ) : null}
          {message.is_sample ? (
            <p className="text-xs text-amber-700">Live API send is blocked because this lead is labelled sample data.</p>
          ) : null}
          <form action={send}>
            <input type="hidden" name="messageId" value={message.id} />
            <input type="hidden" name="method" value="manual" />
            <Button type="submit" variant="outline" disabled={sending}>
              Mark as sent manually
            </Button>
          </form>
          {waLink && message.status !== "draft" ? (
            <Button asChild variant="outline">
              <a href={waLink} target="_blank" rel="noreferrer">
                Open WhatsApp with approved copy
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
