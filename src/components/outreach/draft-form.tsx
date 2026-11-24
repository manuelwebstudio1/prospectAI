"use client";

import { useActionState } from "react";
import { draftOutreachAction, type OutreachActionState } from "@/app/(app)/dashboard/outreach/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DraftOutreachForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<OutreachActionState, FormData>(draftOutreachAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="space-y-2">
        <Label htmlFor="channel">Channel</Label>
        <select id="channel" name="channel" defaultValue="email" className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Drafting…" : "Draft message (not sent)"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Drafts never send. You must approve, then send. Sample records cannot receive live API delivery.
      </p>
    </form>
  );
}
