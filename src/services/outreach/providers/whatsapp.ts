import { env } from "@/lib/env";

export function whatsappProviderStatus() {
  const configured = Boolean(env.whatsapp.accessToken && env.whatsapp.phoneNumberId);
  return {
    configured,
    reason: configured
      ? null
      : "WhatsApp Cloud API is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID, or send the approved draft yourself.",
  };
}

export async function sendWhatsAppText(input: {
  toDigits: string;
  body: string;
}): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const status = whatsappProviderStatus();
  if (!status.configured) {
    return { ok: false, error: status.reason ?? "WhatsApp is not configured." };
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${env.whatsapp.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsapp.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.toDigits,
        type: "text",
        text: { body: input.body, preview_url: true },
      }),
    },
  );
  const json = (await response.json().catch(() => null)) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    return {
      ok: false,
      error:
        json?.error?.message ??
        `WhatsApp API returned ${response.status}. Business-initiated text often requires a pre-approved template.`,
    };
  }
  return { ok: true, id: json?.messages?.[0]?.id ?? null };
}
