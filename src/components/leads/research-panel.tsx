"use client";

import { useActionState } from "react";
import { runResearchAction, type ResearchActionState } from "@/app/(app)/dashboard/leads/research-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GenerateDemoButton } from "@/components/demos/generate-button";
import type { ResearchRecord } from "@/services/workspace/types";

export function ResearchPanel({
  leadId,
  research,
  aiConfigured,
}: {
  leadId: string;
  research: ResearchRecord | null;
  aiConfigured: boolean;
}) {
  const [state, action, pending] = useActionState<ResearchActionState, FormData>(runResearchAction, null);
  const report = research?.report;
  const architecture = research?.architecture;

  return (
    <div className="space-y-5">
      <form action={action} className="surface-card space-y-4 p-5">
        <div>
          <h2 className="font-semibold">AI research & website brief</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {aiConfigured
              ? "The researcher and architect will use the configured model. They are instructed not to invent facts."
              : "No AI key is configured. ProspectAI will compile a report from discovered records only and apply an industry blueprint. Nothing is invented."}
          </p>
        </div>
        <input type="hidden" name="leadId" value={leadId} />
        <div className="space-y-2">
          <Label htmlFor="userNotes">Additional verified notes (optional)</Label>
          <Textarea
            id="userNotes"
            name="userNotes"
            placeholder="Only add facts you have verified. Invented services or testimonials are not allowed."
          />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Researching…" : aiConfigured ? "Run AI research" : "Compile research from records"}
        </Button>
      </form>

      {report ? (
        <article className="surface-card space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Research report</h2>
            <Badge variant={research.research_mode === "ai" ? "default" : "warning"}>
              {research.research_mode === "ai" ? "AI" : "Records only"}
            </Badge>
            {research.model ? <Badge variant="muted">{research.model}</Badge> : null}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Fact label="Business" value={report.businessName} />
            <Fact label="Industry" value={report.industry} />
            <Fact label="Location" value={report.location} />
            <Fact label="Description" value={report.description} />
            <Fact label="Phone" value={report.publicContacts.phone} />
            <Fact label="Email" value={report.publicContacts.email} />
            <Fact label="Website" value={report.publicContacts.website} />
            <Fact label="Address" value={report.publicContacts.address} />
          </dl>
          <List label="Services" items={report.services} />
          <List label="Products" items={report.products} />
          <p className="text-sm">
            <span className="font-medium">Online presence: </span>
            <span className="text-muted-foreground">{report.onlinePresenceNotes ?? "Unknown"}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Website need: </span>
            <span className="text-muted-foreground">{report.websiteNeed ?? "Unknown"}</span>
          </p>
          <List label="Unknown fields" items={report.unknowns} />
          <List label="Caveats" items={report.caveats} />
        </article>
      ) : null}

      {architecture?.pages?.length ? (
        <article className="surface-card space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Website architect brief</h2>
            <Badge variant={research?.architect_mode === "ai" ? "default" : "secondary"}>
              {research?.architect_mode === "ai" ? "AI refined" : "Industry blueprint"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{architecture.rationale}</p>
          <p className="text-sm">
            <span className="font-medium">Type: </span>
            {architecture.websiteType}
          </p>
          <p className="text-sm">
            <span className="font-medium">Design: </span>
            {architecture.designDirection}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(architecture.colourPalette ?? {}).map(([name, value]) => (
              <span key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <i className="h-4 w-4 rounded-full border" style={{ background: value }} />
                {name} {value}
              </span>
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            {architecture.pages.map((page) => (
              <li key={page.slug}>
                <span className="font-medium">{page.title}</span>
                <span className="text-muted-foreground"> — {page.purpose}</span>
              </li>
            ))}
          </ul>
          <List label="Functionality" items={architecture.requiredFunctionality} />
          <div className="border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Generate an unofficial ProspectAI preview. It will never be presented as this business’s official website.
            </p>
            <GenerateDemoButton leadId={leadId} researchId={research?.id} />
          </div>
        </article>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{value || <span className="text-muted-foreground">Unknown</span>}</dd>
    </div>
  );
}

function List({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {items?.length ? (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Unknown</p>
      )}
    </div>
  );
}
