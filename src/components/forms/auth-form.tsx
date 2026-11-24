"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/app/(auth)/actions";
import { SUPPORTED_COUNTRIES, BUSINESS_CATEGORIES } from "@/constants";
import { isSupabaseConfigured } from "@/lib/env";

function Alert({ state }: { state: ActionState }) {
  if (!state?.error && !state?.success) return null;
  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        state.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {state.error ?? state.success}
    </p>
  );
}

export function LoginForm({ action }: { action: (state: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      {!isSupabaseConfigured() ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Development mode: Supabase is not connected. Signing in creates a local preview session only.
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@studio.com" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export function RegisterForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required placeholder="Kofi Amanor" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@studio.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating workspace..." : "Create account"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}

export function OnboardingForm({
  action,
  defaultName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultName: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required defaultValue={defaultName} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="companyName">Company or agency</Label>
        <Input id="companyName" name="companyName" required placeholder="Northline Studio" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            name="country"
            className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            defaultValue="GH"
          >
            {SUPPORTED_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessType">Business type</Label>
          <select
            id="businessType"
            name="businessType"
            className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            defaultValue="freelancer"
          >
            <option value="freelancer">Freelance web developer</option>
            <option value="web_agency">Web development agency</option>
            <option value="software_company">Software company</option>
            <option value="marketing_agency">Digital marketing agency</option>
            <option value="consultant">Website design consultant</option>
            <option value="other">Independent entrepreneur</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="primaryIndustry">Primary industry you sell into</Label>
        <select
          id="primaryIndustry"
          name="primaryIndustry"
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          defaultValue="Professional services"
        >
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="intendedUse">How will you use ProspectAI?</Label>
        <Textarea
          id="intendedUse"
          name="intendedUse"
          required
          placeholder="Find local restaurants without websites and send demo previews."
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Enter dashboard"}
      </Button>
    </form>
  );
}

export function ContactForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
