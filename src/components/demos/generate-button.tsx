"use client";

import { useActionState } from "react";
import { generateDemoAction, type DemoActionState } from "@/app/(app)/dashboard/demos/actions";
import { Button } from "@/components/ui/button";

export function GenerateDemoButton({
  leadId,
  researchId,
  label = "Generate unofficial demo",
}: {
  leadId?: string | null;
  researchId?: string | null;
  label?: string;
}) {
  const [state, action, pending] = useActionState<DemoActionState, FormData>(generateDemoAction, null);

  return (
    <form action={action} className="space-y-2">
      {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
      {researchId ? <input type="hidden" name="researchId" value={researchId} /> : null}
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : label}
      </Button>
    </form>
  );
}
