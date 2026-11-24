import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function isMoolreConfigured() {
  return Boolean(env.moolre?.apiUser && env.moolre?.publicKey && env.moolre?.accountNumber);
}

export function moolreStatus() {
  return {
    configured: isMoolreConfigured(),
    webhookReady: Boolean(isMoolreConfigured() && env.moolre?.walletSecret),
    reason: isMoolreConfigured()
      ? null
      : "Moolre is not configured. Set MOOLRE_API_USER, MOOLRE_PUBLIC_KEY and MOOLRE_ACCOUNT_NUMBER.",
  };
}

type MoolreEnvelope = {
  status?: number;
  code?: string;
  message?: string;
  data?: Record<string, unknown> | unknown[];
  meta?: { requestid?: string };
};

async function moolrePost(path: string, body: Record<string, unknown>): Promise<MoolreEnvelope> {
  if (!isMoolreConfigured()) {
    throw new Error(moolreStatus().reason ?? "Moolre is not configured.");
  }
  const response = await fetch(`${env.moolre.baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-USER": env.moolre.apiUser!,
      "X-API-PUBKEY": env.moolre.publicKey!,
      "X-Moolre-Http-Status": "strict",
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as MoolreEnvelope | null;
  if (!json) {
    throw new Error(`Moolre returned ${response.status} with an unreadable body.`);
  }
  return json;
}

export async function createMoolrePaymentLink(input: {
  amountGhs: number;
  email: string;
  externalRef: string;
  redirectUrl: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const payload = {
    type: 1,
    amount: input.amountGhs.toFixed(2),
    email: input.email,
    externalref: input.externalRef,
    currency: "GHS",
    accountnumber: env.moolre.accountNumber,
    reusable: "0",
    expiration_time: 60,
    redirect: input.redirectUrl,
    callback: input.callbackUrl,
    metadata: input.metadata,
  };
  const result = await moolrePost("/embed/link", payload);
  const data = result.data && !Array.isArray(result.data) ? result.data : null;
  const authorizationUrl = typeof data?.authorization_url === "string" ? data.authorization_url : null;
  const reference = typeof data?.reference === "string" ? data.reference : null;
  if (result.code !== "POS09" || !authorizationUrl) {
    throw new Error(result.message || `Moolre did not create a payment link (${result.code ?? "unknown"}).`);
  }
  return { authorizationUrl, reference: reference ?? input.externalRef };
}

export async function getMoolrePaymentStatus(externalRef: string): Promise<{
  txstatus: 0 | 1 | 2 | null;
  amount: number | null;
  transactionId: string | null;
  raw: MoolreEnvelope;
}> {
  const result = await moolrePost("/open/transact/status", {
    type: 1,
    idtype: "1",
    id: externalRef,
    accountnumber: env.moolre.accountNumber,
  });
  const data = result.data && !Array.isArray(result.data) ? result.data : null;
  return {
    txstatus: asTxStatus(data?.txstatus),
    amount: asAmount(data?.amount),
    transactionId: typeof data?.transactionid === "string" ? data.transactionid : null,
    raw: result,
  };
}

export type MoolreWebhookPayload = {
  eventId: string;
  event: string;
  code: string | null;
  txstatus: 0 | 1 | 2 | null;
  amount: number | null;
  externalRef: string | null;
  transactionId: string | null;
  reason: string | null;
  accountNumber: string | null;
  raw: Record<string, unknown>;
};

export function parseMoolreWebhook(rawBody: string, eventIdHeader: string | null): MoolreWebhookPayload | null {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
  const data = json.data && typeof json.data === "object" && !Array.isArray(json.data)
    ? (json.data as Record<string, unknown>)
    : {};
  const eventId = (typeof json.event_id === "string" && json.event_id) || eventIdHeader;
  if (!eventId) return null;
  return {
    eventId,
    event: typeof json.event === "string" ? json.event : "",
    code: typeof json.code === "string" ? json.code : null,
    txstatus: asTxStatus(data.txstatus),
    amount: asAmount(data.amount),
    externalRef: typeof data.externalref === "string" ? data.externalref : null,
    transactionId: typeof data.transactionid === "string" ? data.transactionid : null,
    reason: typeof data.reason === "string" ? data.reason : null,
    accountNumber: typeof data.accountnumber === "string" ? data.accountnumber : null,
    raw: json,
  };
}

function asTxStatus(value: unknown): 0 | 1 | 2 | null {
  const n = Number(value);
  if (n === 0 || n === 1 || n === 2) return n;
  return null;
}

function asAmount(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function verifyMoolreSignature(rawBody: string, header: string | null): boolean {
  const secret = env.moolre?.walletSecret;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isInteger(t) || !v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function amountsMatch(expectedGhs: number, reported: number | null) {
  if (reported == null || !Number.isFinite(reported)) return false;
  return Math.abs(expectedGhs - reported) < 0.05;
}
