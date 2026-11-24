"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUSINESS_CATEGORIES,
  GHANA_REGIONS,
  SUPPORTED_COUNTRIES,
  WEBSITE_STATUS_FILTERS,
} from "@/constants";
import type { CampaignActionState } from "@/app/(app)/dashboard/campaigns/actions";

export function CampaignForm({
  action,
  placesConfigured,
}: {
  action: (state: CampaignActionState, formData: FormData) => Promise<CampaignActionState>;
  placesConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const placesReady = placesConfigured;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>
      ) : null}
      {!placesReady ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Google Places is not connected. Starting discovery runs a labelled sample directory so you can test the workflow. Sample records are not verified businesses.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required placeholder="Accra restaurants without websites" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <select id="country" name="country" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="GH">
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">Region</Label>
          <select id="region" name="region" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="Greater Accra">
            {GHANA_REGIONS.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City or area</Label>
          <Input id="city" name="city" required placeholder="Accra" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Business category</Label>
          <select id="industry" name="industry" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="Restaurants">
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customCategory">Custom search</Label>
          <Input id="customCategory" name="customCategory" placeholder="Optional keyword" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discoveryLimit">Number of businesses</Label>
          <Input id="discoveryLimit" name="discoveryLimit" type="number" min={10} max={5000} defaultValue={50} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="websiteStatusFilter">Website status</Label>
          <select id="websiteStatusFilter" name="websiteStatusFilter" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="no_website">
            {WEBSITE_STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
          Save draft
        </Button>
        <Button type="submit" name="intent" value="start" disabled={pending}>
          {pending ? "Queuing..." : "Start discovery"}
        </Button>
      </div>
    </form>
  );
}
