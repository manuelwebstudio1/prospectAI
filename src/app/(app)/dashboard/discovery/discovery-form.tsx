"use client";

import { useActionState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_CATEGORIES,
  GHANA_REGIONS,
  SUPPORTED_COUNTRIES,
  WEBSITE_STATUS_FILTERS,
} from "@/constants";
import { createDiscoveryCampaignAction, type DiscoveryState } from "./actions";

export function DiscoveryForm() {
  const [state, action, pending] = useActionState<DiscoveryState, FormData>(
    createDiscoveryCampaignAction,
    null,
  );

  return (
    <form action={action} className="surface-card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign name" name="name" placeholder="Accra restaurants without websites" required />
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select id="country" name="country" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="GH">
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <select id="region" name="region" className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
            <option value="">Select region</option>
            {GHANA_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <Field label="City or area" name="city" placeholder="Accra" required />
        <div className="space-y-2">
          <Label htmlFor="industry">Business category</Label>
          <select id="industry" name="industry" className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
            {BUSINESS_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <Field label="Custom category (optional)" name="customCategory" placeholder="e.g. dental clinics" />
        <Field label="Number of businesses" name="discoveryLimit" type="number" defaultValue="20" min={10} max={5000} required />
        <div className="space-y-2">
          <Label htmlFor="websiteStatusFilter">Website status</Label>
          <select
            id="websiteStatusFilter"
            name="websiteStatusFilter"
            className="h-11 w-full rounded-xl border bg-card px-3 text-sm"
            defaultValue="no_website"
          >
            {WEBSITE_STATUS_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-700">
          {state.success}
          {state.campaignId ? (
            <>
              {" "}
              <a className="font-semibold underline" href={`/dashboard/campaigns/${state.campaignId}`}>
                Open campaign
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Queuing…" : "Start discovery"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
