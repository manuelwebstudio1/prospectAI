import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isMoolreConfigured } from "@/lib/payments/moolre";
import { getPaymentByRef } from "@/services/workspace/billing-store";
import { reconcileMoolrePayment } from "@/services/billing/fulfill";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ref?: string } | null;
  const ref = body?.ref?.trim();
  if (!ref) {
    return NextResponse.json({ error: "ref is required" }, { status: 400 });
  }

  const payment = await getPaymentByRef(ref);
  if (!payment || payment.organization_id !== user.organizationId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (payment.status === "paid" || payment.status === "failed") {
    return NextResponse.json({ status: payment.status, ref });
  }
  if (!isMoolreConfigured()) {
    return NextResponse.json({ status: payment.status, ref, reason: "Moolre is not configured." });
  }

  const result = await reconcileMoolrePayment(ref);
  return NextResponse.json({ status: result.status, ref, reason: "reason" in result ? result.reason : undefined });
}
