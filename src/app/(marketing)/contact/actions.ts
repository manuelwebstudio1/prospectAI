"use server";

import { env } from "@/lib/env";
import { contactSchema } from "@/lib/validation/auth";

export type ContactState = { error?: string; success?: string } | null;

export async function submitContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  if (!env.resendKey) {
    return {
      success:
        "Message received locally. Resend is not configured, so no email was sent. Add RESEND_API_KEY to deliver contact messages.",
    };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.resendKey);
  const { error } = await resend.emails.send({
    from: env.resendFrom,
    to: "hello@prospectai.com",
    replyTo: parsed.data.email,
    subject: `ProspectAI contact from ${parsed.data.name}`,
    text: `${parsed.data.message}\n\nCompany: ${parsed.data.company ?? "n/a"}\nEmail: ${parsed.data.email}`,
  });

  if (error) return { error: error.message };
  return { success: "Thanks — we’ll get back to you shortly." };
}
