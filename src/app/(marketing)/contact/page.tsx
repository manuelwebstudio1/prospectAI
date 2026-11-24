"use client";

import { useActionState } from "react";
import { submitContactAction, type ContactState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    submitContactAction,
    null,
  );

  return (
    <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
      <p className="mt-3 text-slate-400">
        Partnerships, support, or a demo of ProspectAI — send a note.
      </p>
      <form action={action} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-200">Name</Label>
          <Input id="name" name="name" required className="bg-white/5 text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">Email</Label>
          <Input id="email" name="email" type="email" required className="bg-white/5 text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company" className="text-slate-200">Company</Label>
          <Input id="company" name="company" className="bg-white/5 text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message" className="text-slate-200">Message</Label>
          <Textarea id="message" name="message" required className="bg-white/5 text-white" />
        </div>
        {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </form>
    </section>
  );
}
