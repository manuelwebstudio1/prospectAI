"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction, type SettingsState } from "./actions";

export function SettingsForm({
  fullName,
  organizationName,
}: {
  fullName: string;
  organizationName: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    null,
  );

  return (
    <form action={action} className="surface-card space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Workspace name</Label>
        <Input id="organizationName" name="organizationName" defaultValue={organizationName} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
