"use client";

import { useActionState } from "react";
import { inspectUrlAction, type AnalyzerState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function AnalyzerForm() {
  const [state, action, pending] = useActionState<AnalyzerState, FormData>(inspectUrlAction, null);
  const result = state?.result;

  return (
    <div className="space-y-5">
      <form action={action} className="surface-card space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" name="businessName" placeholder="Optional, used for name matching" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sourceUrl">Website URL</Label>
          <Input id="sourceUrl" name="sourceUrl" placeholder="https://example.com" required />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Inspecting…" : "Inspect website"}
        </Button>
      </form>

      {result ? (
        <article className="surface-card space-y-3 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Inspection result</h2>
            <Badge>{result.verificationStatus.replaceAll("_", " ")}</Badge>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Reachable</dt><dd>{result.isReachable ? "Yes" : "No"}</dd></div>
            <div><dt className="text-muted-foreground">HTTP</dt><dd>{result.httpStatus ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Confidence</dt><dd>{Math.round(result.confidence * 100)}%</dd></div>
            <div><dt className="text-muted-foreground">Source</dt><dd>{result.evidenceSource}</dd></div>
            <div className="sm:col-span-2 break-all"><dt className="text-muted-foreground">Final URL</dt><dd>{result.finalUrl ?? "—"}</dd></div>
          </dl>
          <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs">
            {JSON.stringify(result.evidence, null, 2)}
          </pre>
        </article>
      ) : null}
    </div>
  );
}
