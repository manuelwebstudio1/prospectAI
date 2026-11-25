"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, loginAction, registerAction, type ActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPublicSupabaseConfigured } from "@/lib/public-env";

function DevNotice() {
  if (isPublicSupabaseConfigured()) return null;
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Supabase is not configured. Signing in uses a labelled local development session so you can explore the product.
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, null);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to your ProspectAI workspace.</p>
      <form action={action} className="mt-6 space-y-4">
        <DevNotice />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(registerAction, null);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        14-day trial. After you sign up you land in your dashboard — no extra setup wall.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <DevNotice />
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company or agency</Label>
          <Input id="companyName" name="companyName" placeholder="Optional — we can name it for you" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Opening workspace…" : "Create workspace"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    forgotPasswordAction,
    null,
  );
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We’ll email a reset link if the account exists.</p>
      <form action={action} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary">
          Back to login
        </Link>
      </p>
    </div>
  );
}
