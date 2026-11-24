import { env } from "@/lib/env";

export function emailProviderStatus() {
  return {
    configured: Boolean(env.resendKey),
    from: env.resendFrom,
    reason: env.resendKey ? null : "RESEND_API_KEY is not configured. Email is not sent.",
  };
}

export async function sendOutreachEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const status = emailProviderStatus();
  if (!status.configured) {
    return { ok: false, error: status.reason ?? "Email is not configured." };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.resendKey);
  const { data, error } = await resend.emails.send({
    from: env.resendFrom,
    to: input.to,
    subject: input.subject,
    text: input.body,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id ?? null };
}
