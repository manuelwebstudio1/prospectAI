"use client";

import { useActionState } from "react";
import { submitContactAction, type ContactState } from "./actions";
import { PageIntro } from "@/components/marketing/page-intro";
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
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            Let’s start a <em className="italic">project</em>
          </>
        }
        description="Partnerships, support, or a demo of ProspectAI — send a note."
      />
      <form action={action} className="marketing-card mt-12 space-y-4 p-6 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required className="bg-white" />
        </div>
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        <Button
          type="submit"
          disabled={pending}
          className="h-12 rounded-full bg-[#171717] px-6 text-white hover:bg-black"
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
      </form>
    </section>
  );
}
