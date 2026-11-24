import { LEAD_STAGES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DraftOutreachForm } from "@/components/outreach/draft-form";
import { addLeadNoteAction, updateLeadStageAction } from "@/app/(app)/dashboard/outreach/actions";
import type { LeadNoteRecord } from "@/services/workspace/types";
import type { LeadStage } from "@/types";
import Link from "next/link";

export function CrmPanel({
  leadId,
  stage,
  notes,
  drafts,
}: {
  leadId: string;
  stage: LeadStage;
  notes: LeadNoteRecord[];
  drafts: Array<{ id: string; status: string; channel: string }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="surface-card space-y-4 p-5">
        <h2 className="font-semibold">CRM stage</h2>
        <form action={updateLeadStageAction} className="space-y-3">
          <input type="hidden" name="leadId" value={leadId} />
          <Label htmlFor="stage">Stage</Label>
          <select id="stage" name="stage" defaultValue={stage} className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
            {LEAD_STAGES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Button type="submit">Update stage</Button>
        </form>
        <div>
          <h3 className="text-sm font-semibold">Notes</h3>
          <form action={addLeadNoteAction} className="mt-2 space-y-2">
            <input type="hidden" name="leadId" value={leadId} />
            <Textarea name="body" placeholder="Record a reply, meeting, or decision. Do not invent facts." />
            <Button type="submit" variant="outline">
              Add note
            </Button>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {notes.length === 0 ? <li className="text-muted-foreground">No notes yet.</li> : null}
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl border px-3 py-2">
                <p>{note.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{note.created_at.replace("T", " ").slice(0, 16)}</p>
              </li>
            ))}
          </ul>
        </div>
      </article>
      <article className="surface-card space-y-4 p-5">
        <h2 className="font-semibold">Outreach draft</h2>
        <DraftOutreachForm leadId={leadId} />
        {drafts.length ? (
          <ul className="space-y-2 text-sm">
            {drafts.map((item) => (
              <li key={item.id}>
                <Link href={`/dashboard/outreach/${item.id}`} className="font-medium hover:text-primary">
                  {item.channel} · {item.status}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </div>
  );
}
