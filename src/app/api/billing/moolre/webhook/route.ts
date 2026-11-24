import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { moolreStatus, verifyMoolreSignature } from "@/lib/payments/moolre";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { handleMoolreWebhook } from "@/services/billing/fulfill";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const status = moolreStatus();
  if (!status.webhookReady) {
    return NextResponse.json(
      { error: "Moolre webhooks are not configured. Set MOOLRE_WALLET_SECRET." },
      { status: 503 },
    );
  }
  if (isSupabaseConfigured()) {
    const service = await createSupabaseServiceClient();
    if (!service) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is required to apply Moolre webhooks." },
        { status: 503 },
      );
    }
  }

  const rawBody = await request.text();
  if (!verifyMoolreSignature(rawBody, request.headers.get("x-moolre-signature"))) {
    return NextResponse.json({ error: "Invalid Moolre signature." }, { status: 400 });
  }

  try {
    const result = await handleMoolreWebhook(rawBody, request.headers);
    return NextResponse.json(result.body, { status: result.httpStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 500 },
    );
  }
}
