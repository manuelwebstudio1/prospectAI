"use client";

import { useActionState } from "react";
import { completeOnboardingAction, type ActionState } from "@/app/(auth)/actions";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_CATEGORIES, SUPPORTED_COUNTRIES } from "@/constants";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    completeOnboardingAction,
    null,
  );

  return (
    <div className="marketing-canvas mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <BrandLogo />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">Set up your workspace</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This takes a minute and helps ProspectAI target the right kinds of businesses.
      </p>
      <form action={action} className="mt-8 space-y-4">
        <Field label="Full name" name="fullName" />
        <Field label="Company or agency" name="companyName" />
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <select id="country" name="country" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" defaultValue="GH">
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessType">Business type</Label>
          <select id="businessType" name="businessType" className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
            <option value="freelancer">Freelance web developer</option>
            <option value="web_agency">Web development agency</option>
            <option value="software_company">Software company</option>
            <option value="marketing_agency">Digital marketing agency</option>
            <option value="consultant">Website design consultant</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryIndustry">Primary industry you sell to</Label>
          <select id="primaryIndustry" name="primaryIndustry" className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
            {BUSINESS_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="intendedUse">How will you use ProspectAI?</Label>
          <Textarea
            id="intendedUse"
            name="intendedUse"
            placeholder="Find restaurants in Accra without websites and send demo sites..."
            required
          />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Go to dashboard"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required />
    </div>
  );
}
