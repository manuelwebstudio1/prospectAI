"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  savePlanAction,
  saveSettingsAction,
  suspendUserAction,
  updateRoleAction,
  type AdminActionState,
} from "@/app/admin/actions";
import type { SubscriptionPlan } from "@/config/plans";
import type { AdminUserRecord, PlatformSettings } from "@/services/workspace/types";

export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(suspendUserAction, null);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspend" value={suspended ? "0" : "1"} />
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      <Button type="submit" size="sm" variant={suspended ? "outline" : "destructive"} disabled={pending}>
        {pending ? "Saving…" : suspended ? "Restore" : "Suspend"}
      </Button>
    </form>
  );
}

export function RoleForm({ userId, role }: { userId: string; role: AdminUserRecord["platform_role"] }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateRoleAction, null);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select name="role" defaultValue={role} className="h-8 rounded-lg border bg-background px-2 text-sm">
        <option value="user">user</option>
        <option value="admin">admin</option>
        <option value="super_admin">super_admin</option>
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}

export function PlanForm({ plan }: { plan: SubscriptionPlan }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(savePlanAction, null);
  return (
    <form action={action} className="surface-card space-y-3 p-5">
      <input type="hidden" name="slug" value={plan.slug} />
      <h2 className="font-semibold">{plan.name}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="monthlyGhs" label="Monthly GHS" defaultValue={plan.monthlyGhs} />
        <Field name="annualGhs" label="Annual GHS" defaultValue={plan.annualGhs} />
        <Field name="discoveryCredits" label="Discovery credits" defaultValue={plan.discoveryCredits} />
        <Field name="researchCredits" label="Research credits" defaultValue={plan.researchCredits} />
        <Field name="websiteCredits" label="Website credits (-1 unlimited)" defaultValue={plan.websiteCredits} />
        <Field name="outreachCredits" label="Outreach credits" defaultValue={plan.outreachCredits} />
        <Field name="maxTeamMembers" label="Max team members" defaultValue={plan.maxTeamMembers} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}

export function SettingsAdminForm({ settings }: { settings: PlatformSettings }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveSettingsAction, null);
  return (
    <form action={action} className="surface-card max-w-lg space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="trial_days">Trial days</Label>
        <Input id="trial_days" name="trial_days" type="number" min={0} max={90} defaultValue={settings.trial_days} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="default_plan">Default plan</Label>
        <select
          id="default_plan"
          name="default_plan"
          defaultValue={settings.default_plan}
          className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
        >
          <option value="starter">starter</option>
          <option value="professional">professional</option>
          <option value="agency">agency</option>
        </select>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" defaultValue={defaultValue} required />
    </div>
  );
}
